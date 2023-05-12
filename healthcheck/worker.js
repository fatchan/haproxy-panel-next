'use strict';

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const redis = require('../redis.js');
const redlock = require('../redlock.js');
const Queue = require('bull');
const healthCheckQueue = new Queue('healthchecks', {
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
	password: process.env.REDIS_PASS || '',
});
const https = require('https');
const httpsAgent = new https.Agent({
	rejectUnauthorized: false,
});

async function doCheck(domainKey, hkey, record) {
	// console.log(domainKey, hkey)
	await new Promise(res => setTimeout(res, Math.floor(Math.random()*1000)));
	try {
		let recordHealth = await redis.get(`health:${record.ip}`);
		if (recordHealth === null) {
			try {
				// console.log('healthchecking', record.ip);
				const controller = new AbortController();
				const signal = controller.signal;
				setTimeout(() => {
					controller.abort();
				}, 3000);
				await fetch(`https://${record.ip}/`, {
					method: 'HEAD',
					headers: { 'Host': 'basedflare.com' },
					agent: httpsAgent,
					signal,
				});
				recordHealth = '1'; //no error = we consider successful
			} catch(e) {
				console.warn('health check down for', record.ip);
				recordHealth = '0';
			}
			await redis.client.set(`health:${record.ip}`, recordHealth, 'EX', 5, 'NX');
		}
		// console.log(record.ip, 'health:', recordHealth);
		if (recordHealth === '1' && record.u === false) {
			record.u = true;
		 	return record;
		} else if (recordHealth === '0' && record.u === true) {
			record.u = false;
			return record;
		}
		return record; //no change required, or no cache and failed fetch
	} catch(e) {
		console.error(e);
		return record;
	}
}

async function processKey(domainKey) {
	try {
		const domainHashKeys = await redis.client.hkeys(domainKey);
		await Promise.allSettled(domainHashKeys.map(async (hkey) => {
			const lock = await redlock.acquire([`lock:${domainKey}:${hkey}`], 5000);
			try {
				const records = await redis.hget(domainKey, hkey);
				const updatedA = await Promise.all((records['a']||[]).map(async r => doCheck(domainKey, hkey, r)));
				const updatedAAAA = await Promise.all((records['aaaa']||[]).map(async r => doCheck(domainKey, hkey, r)));
				records['a'] = updatedA;
				records['aaaa'] = updatedAAAA;
				await redis.hset(domainKey, hkey, records);
			} catch(e) {
				console.error(e);
			} finally {
				await lock.release();
			}
		}));
	} catch(e) {
		console.error(e);
	}
}

async function handleJob(job, done) { //job.id, job.data
	const { keys } = job.data;
	keys.forEach(processKey);
	done();
}

healthCheckQueue.process(handleJob);
