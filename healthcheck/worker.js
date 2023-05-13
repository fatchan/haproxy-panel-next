'use strict';

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const { isIPv4 } = require('net');
const redis = require('../redis.js');
const redlock = require('../redlock.js');
const Queue = require('bull');
const healthCheckQueue = new Queue('healthchecks', { redis: {
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
	password: process.env.REDIS_PASS || '',
}});
const https = require('https');
const httpsAgent = new https.Agent({
	rejectUnauthorized: false,
});

async function doCheck(domainKey, hkey, record) {
	if (!record || record.h !== true) {
		record.u = true;
		return record;
	}
	//await new Promise(res => setTimeout(res, Math.floor(Math.random()*1000)));
	const lock = await redlock.acquire([`lock:${record.ip}`], 30000);
	try {
		let recordHealth = await redis.get(`health:${record.ip}`);
		if (recordHealth === null) {
			try {
				const controller = new AbortController();
				const signal = controller.signal;
				setTimeout(() => {
					controller.abort();
				}, 3000);
				const host = isIPv4(record.ip) ? record.ip : `[${record.ip}]`;
				const hostHeader = domainKey.substring(4, domainKey.length-1);
				await fetch(`https://${host}/`, {
					method: 'HEAD',
					headers: { 'Host': hostHeader },
					agent: httpsAgent,
					signal,
				});
				recordHealth = '1'; //no error = we consider successful
			} catch(e) {
				console.warn('health check down for', record.ip);
				recordHealth = '0';
			}
			await redis.client.set(`health:${record.ip}`, recordHealth, 'EX', 5, 'NX');
			//console.log(domainKey, hkey, record.ip, 'fetch()ed health:', recordHealth);
		} else {
			//console.log(domainKey, hkey, record.ip, 'cached health:', recordHealth);
		}
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
	} finally {
		await lock.release();
	}
}

async function processKey(domainKey) {
	try {
		const domainHashKeys = await redis.client.hkeys(domainKey);
		domainHashKeys.forEach(async (hkey) => {
			const lock = await redlock.acquire([`lock:${domainKey}:${hkey}`], 30000);
			try {
				const records = await redis.hget(domainKey, hkey);
				const allIps = (records['a']||[]).concat((records['a']||[]));
				if (allIps.length > 0) {
					const updatedA = await Promise.all((records['a']||[]).map(async r => doCheck(domainKey, hkey, r)));
					const updatedAAAA = await Promise.all((records['aaaa']||[]).map(async r => doCheck(domainKey, hkey, r)));
					if (updatedA && updatedA.length > 0) {
						records['a'] = updatedA;
					}
					if (updatedAAAA && updatedAAAA.length > 0) {
						records['aaaa'] = updatedAAAA;
					}
					await redis.hset(domainKey, hkey, records);
				}
			} catch(e) {
				console.error(e);
			} finally {
				await lock.release();
			}
		});
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
