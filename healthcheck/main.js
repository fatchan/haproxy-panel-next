'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });

import * as redis from '../redis.js';
import Queue from 'bull';
const healthCheckQueue = new Queue('healthchecks', { redis: {
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
	password: process.env.REDIS_PASS || '',
	db: 1,
}});

function scanKeys(pattern) {
	return new Promise((resolve, reject) => {
		const stream = redis.client.scanStream({
			match: pattern,
		});
		stream.on('data', (keys) => {
			if (!keys || keys.length === 0) { return; }
			//console.log(keys)
			healthCheckQueue.add({ keys }, { removeOnComplete: true });
		});
		stream.on('end', () => {
			resolve();
		});
		stream.on('error', (err) => {
			reject(err);
		});
	});
}

async function main() {
	const start = Date.now();
	try {
		await scanKeys('dns:*');
	} catch(e) {
		console.error(e);
		setTimeout(main, 120000);
		return;
	}
	setTimeout(main, 60000);
}

main();
