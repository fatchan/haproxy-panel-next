'use strict'; 

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import fetch from 'node-fetch';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import AutodiscoverService from '../autodiscover.js';
const autodiscoverService = new AutodiscoverService();

// import Queue from 'bull';
// 
// const haproxyStatsQueue = new Queue('stats', { redis: {
	// host: process.env.REDIS_HOST || '127.0.0.1',
	// port: process.env.REDIS_PORT || 6379,
	// password: process.env.REDIS_PASS || '',
	// db: 1,
// }});

//TODO: move to worker
import agent from '../agent.js';

const base64Auth = Buffer.from(`${process.env.DATAPLANE_USER}:${process.env.DATAPLANE_PASS}`).toString('base64');

async function overwriteMap(url, mapName, entries) {
	const controller = new AbortController();
	const signal = controller.signal;
	setTimeout(() => {
		controller.abort();
	}, 30000);
	const queryString = new URLSearchParams({ map: mapName }).toString();
	return fetch(`${url.protocol}//${url.host}/v3/services/haproxy/runtime/maps_entries?${queryString}`, {
		method: 'POST',
		agent,
		headers: {
			'authorization': `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(entries),
	})
		.catch(err => console.error(err));
};

async function getMapEntries(url, mapName) {
	const controller = new AbortController();
	const signal = controller.signal;
	setTimeout(() => {
		controller.abort();
	}, 30000);
	const queryString = new URLSearchParams({ map: mapName }).toString();
	return fetch(`${url.protocol}//${url.host}/v3/services/haproxy/runtime/maps_entries?${queryString}`, {
		agent,
		headers: {
			'authorization': `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
		},
		signal,
	})
		.then(res => res.json())
		.catch(err => console.error(err));
};

async function listMaps(url) {
	const controller = new AbortController();
	const signal = controller.signal;
	setTimeout(() => {
		controller.abort();
	}, 30000);
	return fetch(`${url.protocol}//${url.host}/v3/services/haproxy/runtime/maps`, {
		agent,
		headers: {
			'authorization': `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
		},
		signal,
	})
		.then(res => res.json())
		.then(jsonData => {
			jsonData.forEach(obj => {
			  const match = obj.description.match(/entry_cnt=(\d+)/);
			  if (match) {
			    const size = parseInt(match[1]);
			    obj.size = size;
			  }
			});
			return jsonData;
		})
		.catch(err => console.error(err));
};

const MAPS_TO_SYNC = new Set([
	'blockedasn.map',
	'blockedcc.map',
	'blockedip.map',
	'ddos_config.map',
	'ddos.map',
	'ddos_global.map',
	'domtoacc.map',
	'hosts.map',
	'maintenance.map',
	'redirect.map',
	'rewrite.map',
	'whitelist.map',
]);

const mapCountsEqual = (obj1, obj2) => Object
	.keys(obj1)
	.every(key => {
		return key === 'synced'
			|| (obj1[key] === obj2[key]);
	});

const masterHostname = process.env.SYNC_MASTER_HOSTNAME;

async function main() {
	try {

		console.time('Running sync check');

		let mapTable = {};
		await Promise.all(autodiscoverService.urls.map(async url => {
			try {
				const serverMapList = await listMaps(url);
				const mapCounts = serverMapList
					.filter(m => MAPS_TO_SYNC.has(m.storage_name))
					.reduce((acc, m) => {
						acc[m.storage_name] = m.size;
						return acc;
					}, {});
				mapTable[url.hostname] = mapCounts;
			} catch(e) {
				console.warn(e);
			}
		}));

		const master = mapTable[masterHostname];

		if (!master
			|| Object.keys(master).length < MAPS_TO_SYNC.size
			|| !Object.values(master).every(v => !isNaN(v))) {
			console.table(mapTable);
			return console.error('Failed to get master record of map sizes');
		}

		for (let [key, mapCount] of Object.entries(mapTable)) {
			mapTable[key].synced = mapCountsEqual(mapCount, master);
		}

		console.table(mapTable);
		
		console.timeEnd('Running sync check');

		for (let key in mapTable) {
			if (!mapTable[key].synced) {
				console.warn('WARNING:', key, 'is out of sync with', masterHostname);
				console.table({
					[masterHostname]: mapTable[masterHostname],
					[key]: mapTable[key],
				});
				//TODO: push a sync job to bull queue
			}
		}

	} catch(e) {
		console.error(e);
	}
}

autodiscoverService.init().then(() => {
	main();
	setInterval(main, 60000);
});
