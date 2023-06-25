'use strict';

process
        .on('uncaughtException', console.error)
        .on('unhandledRejection', console.error);

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const redis = require('./redis.js')
	, { nsTemplate, soaTemplate, aTemplate, aaaaTemplate } = require('./templates.js');

async function processKey(domainKey) {
	const domainHashKeys = await redis.client.hkeys(domainKey);
	const domain = domainKey.substring(4, domainKey.length-1);
	console.log('Updating', domain);
	return Promise.all(domainHashKeys.map(async (hkey) => {
		try {
			const records = await redis.hget(domainKey, hkey);
			if (records['a'] && records['a'][0]["t"] === true) {
				records['a'] = JSON.parse(JSON.stringify(aTemplate));
			}
			if (records['aaaa'] && records['aaaa'][0]["t"] === true) {
				records['aaaa'] = JSON.parse(JSON.stringify(aaaaTemplate));
			}
			if (records['ns'] && records['ns'][0]["t"] === true) {
				const locked = records['ns']['l'] === true;
				records['ns'] = JSON.parse(JSON.stringify(nsTemplate));
				records['ns'].forEach(r => r['l'] = locked);
			}
			if (records['soa'] && records['soa']["t"] === true) {
				const locked = records['soa']['l'] === true;
				records['soa'] = JSON.parse(JSON.stringify(soaTemplate))[0];
				records['soa']['l'] = locked;
				records['soa'].MBox = `root.${domain}.`;
			}
			await redis.hset(domainKey, hkey, records);
		} catch(e) {
			console.error(e);
		}
	}));
}

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
		.catch(e => console.error(e))
	redis.close();
});
stream.on('error', (err) => {
	console.err(err);
	redis.close();
});
