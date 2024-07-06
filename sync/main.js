'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

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
	await fetch(`${url.protocol}//${url.host}/v3/services/haproxy/runtime/maps_entries?${queryString}`, {
		method: 'POST',
		agent,
		headers: {
			'authorization': `Basic ${base64Auth}`,
			'Content-Type': 'application/json',
		},
		signal,
		body: JSON.stringify(entries),
	})
		.then(res => console.log(res.status))
		.catch(err => console.error(err));
};

async function main() {
	try {
		console.log('Running a sync for %d nodes', autodiscoverService.urls.length);
		//TODO: push urls to task queue
		//temp
		await overwriteMap(autodiscoverService.urls[0], 'alt-svc.map', [{key:'x1',value:'y1'},{key:'x2',value:'y2'}]);
	} catch(e) {
		console.error(e);
	}
}

autodiscoverService.init().then(() => {
	main();
	setInterval(main, 60000);
});
