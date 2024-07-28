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
	}, 10000);
	const queryString = new URLSearchParams({ map: mapName }).toString();
	return fetch(`${url.protocol}//${url.host}/v3/services/haproxy/runtime/maps_entries?${queryString}`, {
		method: 'POST',
		agent,
		headers: {
			'authorization': `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
		},
		signal,
		body: JSON.stringify(entries),
	})
		.then(res => res.text())
		.then(res => console.log(res))
		.catch(err => console.error(err));
};

async function getMapEntries(url, mapName) {
	const controller = new AbortController();
	const signal = controller.signal;
	setTimeout(() => {
		controller.abort();
	}, 10000);
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
	}, 10000);
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


async function main() {
	try {
		//TODO: push urls to task queue

		console.log((await listMaps(autodiscoverService.urls[0])));

		// const entries = await getMapEntries(autodiscoverService.urls[0], 'alt-svc.map');
		// console.log(entries)
		// entries.push({ key: 'XX', value: 'h2="alt-af.bfcdn.host:443"; ma=600;' });
		// console.log(entries)
		// await overwriteMap(autodiscoverService.urls[0], 'alt-svc.map', [...entries]);
		// console.log((await getMapEntries(autodiscoverService.urls[0], 'alt-svc.map')));

	} catch(e) {
		console.error(e);
	}
}

autodiscoverService.init().then(() => {
	main();
	setInterval(main, 60000);
});
