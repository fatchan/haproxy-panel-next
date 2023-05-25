'use strict';

process
        .on('uncaughtException', console.error)
        .on('unhandledRejection', console.error);

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const redis = require('../redis.js')
	, Queue = require('bull')
	, haproxyStatsQueue = new Queue('stats', { redis: {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: process.env.REDIS_PORT || 6379,
		password: process.env.REDIS_PASS || '',
	}});

if (!process.env.INFLUX_HOST) {
	return console.warn('INFLUX_HOST not set, statistics will not be recorded');
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
