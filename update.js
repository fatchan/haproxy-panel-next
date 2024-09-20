'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);
h
import dotenv from 'dotenv';
import * as db from './db.js';
await dotenv.config({ path: '.env' });
import * as redis from './redis.js';
import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;

isMain && await db.connect();
import { nsTemplate, soaTemplate, aTemplate, aaaaTemplate } from './templates.js';
isMain && update();

async function processKey(domainKey) {
	const domainHashKeys = await redis.client.hkeys(domainKey);
	const domain = domainKey.substring(4, domainKey.length-1);
	return Promise.all(domainHashKeys.map(async (hkey) => {
		try {
			console.log('Updating', domain);
			const records = await redis.hget(domainKey, hkey);
			if (records['a'] && records['a'][0]['t'] === true) {
				records['a'] = JSON.parse(JSON.stringify((await aTemplate(records['a'][0]['tn']))));
			}
			if (records['aaaa'] && records['aaaa'][0]['t'] === true) {
				records['aaaa'] = JSON.parse(JSON.stringify((await aaaaTemplate(records['aaaa'][0]['tn']))));
			}
			if (records['ns'] && records['ns'][0]['t'] === true) {
				const locked = records['ns']['l'] === true;
				records['ns'] = JSON.parse(JSON.stringify(nsTemplate()));
				records['ns'].forEach(r => r['l'] = locked);
			}
			if (records['soa'] && records['soa']['t'] === true) {
				const locked = records['soa']['l'] === true;
				records['soa'] = JSON.parse(JSON.stringify(soaTemplate()))[0];
				records['soa']['l'] = locked;
				records['soa'].MBox = `root.${domain}.`;
			}
			await redis.hset(domainKey, hkey, records);
		} catch(e) {
			console.error(e);
		}
	}));
}

export default async function update() {
	let allKeys = [];
	const stream = redis.client.scanStream({
		match: 'dns:*',
	});
	stream.on('data', (keys) => {
		if (!keys || keys.length === 0) { return; }
		allKeys = allKeys.concat(keys);
	});
	stream.on('end', async () => {
		await Promise.all(allKeys.map(async k => processKey(k)))
			.catch(e => console.error(e));
		isMain && redis.close();
	});
	stream.on('error', (err) => {
		console.err(err);
		isMain && redis.close();
	});
}
