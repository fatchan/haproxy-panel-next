'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });

import * as redis from '../redis.js';
import Queue from 'bull';
const healthCheckQueue = new Queue('healthchecks', {
	redis: {
		host: redis.lockQueueClient.host,
		port: redis.lockQueueClient.port,
		password: redis.lockQueueClient.password,
		db: redis.lockQueueClient.db,
	}
});

function chunkArray (array, chunkSize) {
	const result = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		result.push(array.slice(i, i + chunkSize));
	}
	return result;
}

async function main () {
	try {
		const keys = await redis.getKeysPattern(redis.lockQueueClient, 'dns:*');
		console.log('Healthchecking', keys.length, 'keys');
		chunkArray(keys, 20).forEach(keyArr => healthCheckQueue.add({ keys: keyArr }, { removeOnComplete: true }));
	} catch (e) {
		console.error(e);
		setTimeout(main, 120000);
		return;
	}
	setTimeout(main, 60000);
}

main();
