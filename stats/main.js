'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import * as redis from '../redis.js';
import AutodiscoverService from '../autodiscover.js';
const autodiscoverService = new AutodiscoverService();

import Queue from 'bull';

const haproxyStatsQueue = new Queue('stats', { createClient: () => redis.lockQueueClient });

if (!process.env.INFLUX_HOST) {
	console.error('INFLUX_HOST not set, statistics will not be recorded');
	process.exit(1);
}

async function main () {
	try {
		console.log('Collecting stats for %d nodes', autodiscoverService.urls.length);
		autodiscoverService.urls.forEach(cu => {
			//group to a certain amount in each array? ehh probs not
			haproxyStatsQueue.add({ hosts: [cu] }, { removeOnComplete: true });
		});
	} catch (e) {
		console.error(e);
	}
}

autodiscoverService.init().then(() => {
	main();
	setInterval(main, 10000);
});
