'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
import { isIPv4 } from 'net';
import * as db from '../db.js';
import * as redis from '../redis.js';
import redlock from '../redlock.js';
import Queue from 'bull';
import https from 'https';
const httpsAgent = new https.Agent({
	rejectUnauthorized: false,
});

const healthCheckQueue = new Queue('healthchecks', { redis: {
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
	password: process.env.REDIS_PASS || '',
	db: 1,
}});

const ignoredErrorCodes = [
	'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
	'ERR_TLS_CERT_ALTNAME_INVALID',
	'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
	'CERT_HAS_EXPIRED',
];

let downedIps = [];

async function doCheck(domainKey, hkey, record) {
	if (!record || record.h !== true) {
		record.u = true;
		return record;
	}
	//await new Promise(res => setTimeout(res, Math.floor(Math.random()*1000)));
	const lock = await redlock.acquire([`lock:${record.ip}`], 30000);
	try {
		let recordHealth;
		if (downedIps.includes(record.ip)) {
			// console.log('FORCED DOWNTIME:', record.ip);
			recordHealth = '0';
		} else {
			recordHealth = await redis.get(`health:${record.ip}`);
		}
		if (recordHealth === null) {
			try {
				const controller = new AbortController();
				const signal = controller.signal;
				setTimeout(() => {
					controller.abort();
				}, 10000);
				const host = isIPv4(record.ip) ? record.ip : `[${record.ip}]`;
				const hostHeader = domainKey.substring(4, domainKey.length-1);
				await fetch(`https://${host}/.basedflare/cgi/trace`, {
					method: 'HEAD',
					redirect: 'manual',
					headers: { 'Host': hostHeader },
					agent: httpsAgent,
					signal,
				});
				recordHealth = '1'; //no error = we consider successful
			} catch(e) {
				if (e && e.cause && e.cause.code && ignoredErrorCodes.includes(e.cause.code)) {
					//invalid certs don't mean the server is dead
					console.info('health check for', domainKey, hkey, record.ip, 'ignoring error', e.cause.code);
					recordHealth = '1';
				} else {
					console.warn(e);
					console.warn('health check down for', domainKey, hkey, record.ip);
					recordHealth = '0';
				}
			}
			await redis.client.set(`health:${record.ip}`, recordHealth, 'EX', 30, 'NX');
			console.info('fetch()ed health:', domainKey, hkey, record.ip, recordHealth);
		} else {
			recordHealth = recordHealth.toString();
			// console.log('cached health:', domainKey, hkey, record.ip, recordHealth);
		}
		if (recordHealth === '1') {
			record.u = true;
		} else if (recordHealth === '0') {
			record.u = false;
		}
		return record; //no change required, or no cache and failed fetch
	} catch(e) {
		console.error(e);
		return record;
	} finally {
		await lock.release();
		return record;
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

async function updateDowned() {
	try {
		downedIps = await db.db().collection('down')
			.findOne({
				_id: 'down',
			})
			.then(res => res && res.ips ? res.ips : []);
		downedIps && downedIps.length > 0 && console.log('downedIps.length', downedIps.length, ', [0]:', downedIps[0]);
	} catch (e) {
		console.error(e);
	}
}

async function main() {
	await db.connect();
	await updateDowned();
	setInterval(() => updateDowned(), 10000);
	healthCheckQueue.process(handleJob);
}

main();
