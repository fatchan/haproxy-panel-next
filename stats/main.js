'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });

import Queue from 'bull';

const haproxyStatsQueue = new Queue('stats', { w: {
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
	password: process.env.REDIS_PASS || '',
	db: 1,
}});

if (!process.env.INFLUX_HOST) {
	console.error('INFLUX_HOST not set, statistics will not be recorded');
	process.exit(1);
}

//TODO: a better process for storing and discovering these? i.e collect from all clusters in db
const clusterUrls = process.env.DEFAULT_CLUSTER.split(',').map(u => new URL(u));

async function main() {
	try {
		clusterUrls.forEach(cu => {
			//group to a certain amount in each array? ehh probs not
			haproxyStatsQueue.add({ hosts: [cu] }, { removeOnComplete: true });
		})
	} catch(e) {
		console.error(e);
	}
}

main();
setInterval(main, 10000);
