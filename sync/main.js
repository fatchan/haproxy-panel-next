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

async function main() {
	try {
		console.log('Running a sync for %d nodes', autodiscoverService.urls.length);
		//TODO
	} catch(e) {
		console.error(e);
	}
}

autodiscoverService.init().then(() => {
	main();
	setInterval(main, 60000);
});
