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
import tls from 'tls';
import net from 'net';
const httpsAgent = new https.Agent({
	rejectUnauthorized: false,
});

const healthCheckQueue = new Queue('healthchecks', {
	redis: {
		host: redis.lockQueueClient.host,
		port: redis.lockQueueClient.port,
		password: redis.lockQueueClient.password,
		db: redis.lockQueueClient.db,
	}
});

const ignoredErrorCodes = [
	'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
	'ERR_TLS_CERT_ALTNAME_INVALID',
	'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
	'CERT_HAS_EXPIRED',
];

let downedIps = [];

//backup for raw handshake check
function checkTLSHandshake (ip, port, domain) {
	return new Promise((resolve, reject) => {
		const controller = new AbortController();
		setTimeout(() => {
			controller.abort();
		}, 15000);
		const socket = net.createConnection(port, ip, () => {
			const secureSocket = new tls.TLSSocket(socket, {
				host: domain,
				rejectUnauthorized: false,
				signal: controller.signal,
			});
			secureSocket.on('secureConnect', () => {
				secureSocket.end();
				resolve(true);
			});

			secureSocket.on('error', (err) => {
				if (err.cause && err.cause.code && ignoredErrorCodes.includes(err.cause.code)) {
					secureSocket.end();
					resolve(true);
				} else {
					secureSocket.end();
					reject(err);
				}
			});
		});
		socket.on('error', (err) => {
			reject(err);
		});
		controller.signal.addEventListener('abort', () => {
			socket.destroy();
			reject(new Error('Connection timed out'));
		});
	});
}

async function doCheck (domainKey, hkey, record) {
	if (!record || record.h !== true) {
		record.u = true;
		return record;
	}
	//await new Promise(res => setTimeout(res, Math.floor(Math.random()*1000)));
	const lock = await redlock.acquire([`lock:${record.ip}`], 60000);
	try {
		let recordHealth;
		if (downedIps.includes(record.ip)) {
			// console.log('FORCED DOWNTIME:', record.ip);
			recordHealth = '0';
		} else {
			recordHealth = await redis.get(`health:${record.ip}`);
		}
		if (recordHealth === null) {
			const hostHeader = domainKey.substring(4, domainKey.length - 1);
			try {
				const controller = new AbortController();
				const signal = controller.signal;
				setTimeout(() => {
					controller.abort();
				}, 15000);
				const host = isIPv4(record.ip) ? record.ip : `[${record.ip}]`;
				await fetch(`https://${host}/${process.env.DOT_PATH}/cgi/trace`, {
					method: 'HEAD',
					redirect: 'manual',
					headers: { 'Host': hostHeader },
					agent: httpsAgent,
					signal,
				});
				recordHealth = '1'; //no error = we consider successful
			} catch (e) {
				if (e && e.cause && e.cause.code && ignoredErrorCodes.includes(e.cause.code)) {
					//invalid certs don't mean the server is dead
					console.info('health check for', domainKey, hkey, record.ip, 'ignoring error', e.cause.code);
					recordHealth = '1';
				} else {
					console.warn(e);
					try {
						//should have plenty of time if abortcontroller is hit, 60s>15s
						const backupHandshakeResponse = await checkTLSHandshake(record.ip, 443, hostHeader);
						recordHealth = backupHandshakeResponse === true ? '1' : '0';
					} catch (e) {
						console.warn('health check down for', domainKey, hkey, record.ip, 'error:', e);
						recordHealth = '0';
					}
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
	} catch (e) {
		console.error('Healthcheck error', domain, hkey, e.message || e);
	} finally {
		await lock.release();
		return record;
	}
}

async function processKey (domainKey) {
	try {
		const domainHashKeys = await redis.client.hkeys(domainKey);
		domainHashKeys.forEach(async (hkey) => {
			const lock = await redlock.acquire([`lock:${domainKey}:${hkey}`], 60000);
			try {
				const records = await redis.hget(domainKey, hkey);
				const allIps = (records['a'] || []).concat((records['aaaa'] || []));
				if (allIps.length > 0) {
					const updatedA = await Promise.all((records['a'] || []).map(async r => doCheck(domainKey, hkey, r)));
					const updatedAAAA = await Promise.all((records['aaaa'] || []).map(async r => doCheck(domainKey, hkey, r)));
					if (updatedA && updatedA.length > 0) {
						records['a'] = updatedA;
					}
					if (updatedAAAA && updatedAAAA.length > 0) {
						records['aaaa'] = updatedAAAA;
					}
					await redis.hset(domainKey, hkey, records);
				}
			} catch (e) {
				console.error(e);
			} finally {
				await lock.release();
			}
		});
	} catch (e) {
		console.error(e);
	}
}

async function handleJob (job, done) { //job.id, job.data
	const { keys } = job.data;
	keys.forEach(processKey);
	done();
}

async function updateDowned () {
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

async function main () {
	await db.connect();
	await updateDowned();
	setInterval(() => updateDowned(), 10000);
	healthCheckQueue.process(handleJob);
}

main();
