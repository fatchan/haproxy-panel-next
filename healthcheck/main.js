import 'dotenv/config';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import * as redis from '../redis.js';
import Queue from 'bull';
const healthCheckQueue = new Queue('healthchecks', {
	redis: {
		host: redis.lockQueueClient.options.host,
		port: redis.lockQueueClient.options.port,
		password: redis.lockQueueClient.options.password,
		db: redis.lockQueueClient.options.db,
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
		const keys = await redis.getKeysPattern(redis.client, 'dns:*');
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
