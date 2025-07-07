'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
import * as db from './db.js';
dotenv.config({ path: '.env' });
import * as redis from './redis.js';
import { pathToFileURL } from 'node:url';
const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;

isMain && await db.connect();
import { getNsTemplate, getSoaTemplate, aTemplate, aaaaTemplate } from './templates.js';
isMain && update();

async function processKey (domainKey) {
	const domainHashKeys = await redis.client.hkeys(domainKey);
	const domain = domainKey.substring(4, domainKey.length - 1);
	return Promise.all(domainHashKeys.map(async (hkey) => {
		try {
			console.log('Updating', domain);
			const records = await redis.hget(domainKey, hkey);
			let defaultTemplate = 'basic';
			const domainAccount = await db.db().collection('accounts').findOne({ domains: domain });
			if (domainAccount && domainAccount.allowedTemplates[0] !== 'basic') {
				//For initial sync of accounts that dont have access to the public template
				defaultTemplate = domainAccount.allowedTemplates[0];
			}
			if (records['a'] && records['a'][0]['t'] === true) {
				const templateName = records['a'][0]['tn'] || defaultTemplate;
				const existingATemplate = (await aTemplate(templateName)) || (await aTemplate(defaultTemplate));
				if (existingATemplate) {
					records['a'] = JSON.parse(JSON.stringify(existingATemplate));
				} else {
					console.warn('Template missing or invalid for domain:', domain, 'record tn:', records['a'][0]['tn']);
				}
			}
			if (records['aaaa'] && records['aaaa'][0]['t'] === true) {
				const templateName = records['aaaa'][0]['tn'] || defaultTemplate;
				const existingAAAATemplate = (await aaaaTemplate(templateName)) || (await aaaaTemplate(defaultTemplate));
				if (existingAAAATemplate) {
					records['aaaa'] = JSON.parse(JSON.stringify(existingAAAATemplate));
				} else {
					console.warn('AAAA Template missing or invalid for domain:', domain, 'record tn:', records['aaaa'][0]['tn']);
				}
			}
			if (records['ns'] && records['ns'][0]['t'] === true) {
				const locked = records['ns']['l'] === true;
				records['ns'] = JSON.parse(JSON.stringify(getNsTemplate()));
				records['ns'].forEach(r => r['l'] = locked);
			}
			if (records['soa'] && records['soa']['t'] === true) {
				const locked = records['soa']['l'] === true;
				records['soa'] = JSON.parse(JSON.stringify(getSoaTemplate()))[0];
				records['soa']['l'] = locked;
				records['soa'].MBox = `root.${domain}.`;
			}
			await redis.hset(domainKey, hkey, records);
		} catch (e) {
			console.error(e);
		}
	}));
}

const close = () => {
	redis.close();
	db.client().close();
};

export default async function update () {
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
		isMain && close();
	});
	stream.on('error', (err) => {
		console.err(err);
		isMain && close();
	});
}
