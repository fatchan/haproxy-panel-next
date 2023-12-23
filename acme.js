'use strict';

import fs from 'fs';
import acme from 'acme-client';
import * as redis from './redis.js';
import redlock from './redlock.js';
import psl from 'psl';

const dev = process.env.NODE_ENV !== 'production';

/**
 * Function used to satisfy an ACME challenge
 *
 * @param {object} authz Authorization object
 * @param {object} challenge Selected challenge
 * @param {string} keyAuthorization Authorization key
 * @returns {Promise}
 */

async function challengeCreateFn(authz, challenge, keyAuthorization) {
	console.log('Triggered challengeCreateFn()');
	// console.log('authz', authz);
	// console.log('challenge', challenge);
	// console.log('keyAuthorization', keyAuthorization);

	/* http-01 */
	if (challenge.type === 'http-01') {
		const filePath = `/tmp/.well-known/acme-challenge/${challenge.token}`;
		const fileContents = keyAuthorization;
		console.log(`Creating challenge response for ${authz.identifier.value} at path: ${filePath}`);
		await fs.writeFile(filePath, fileContents);
	}

	/* dns-01 */
	else if (challenge.type === 'dns-01') {
		const parsed = psl.parse(authz.identifier.value);
		const domain = parsed.domain;
		let subdomain = '_acme-challenge';
		let caaSubdomain = '@';
		if (parsed.subdomain && parsed.subdomain.length > 0) {
			subdomain += `.${parsed.subdomain}`;
			caaSubdomain = parsed.subdomain;
		}
		const lock = await redlock.acquire([`lock:${domain}:${subdomain}`], 10000);
		const lock2 = await redlock.acquire([`lock:${domain}:${caaSubdomain}`], 10000);
		try {
			const recordValue = keyAuthorization;
			//TXT record
			console.log(`Creating TXT record for "${subdomain}.${domain}" with value "${recordValue}"`);
			const record = { ttl: 300, text: recordValue, l: true, t: true };
			let recordSetRaw = await redis.hget(`dns:${domain}.`, subdomain);
			if (!recordSetRaw) {
				recordSetRaw = {};
			}
			recordSetRaw['txt'] = (recordSetRaw['txt']||[]).concat([record]);
			await redis.hset(`dns:${domain}.`, subdomain, recordSetRaw);
			console.log(`Created TXT record for "${subdomain}.${domain}" with value "${recordValue}"`);
			//CAA record (testing)
			console.log(`Creating TXT record for "${caaSubdomain}.${domain}"`);
			let caaRecordSetRaw = await redis.hget(`dns:${domain}.`, caaSubdomain);
			if (!caaRecordSetRaw) {
				caaRecordSetRaw = {};
			}
			if (!caaRecordSetRaw['caa']) {
				caaRecordSetRaw['caa'] = [{
					'ttl': 86400,
					'value': 'letsencrypt.org',
					'flag': 0,
					'tag': 'issue',
					't': true
				}];
				await redis.hset(`dns:${domain}.`, caaSubdomain, caaRecordSetRaw);
			}
			console.log(`Created TXT record for "${caaSubdomain}.${domain}"`);
		} catch(e) {
			console.error(e);
		} finally {
			await lock.release();
			await lock2.release();
		}
	}
}

/**
 * Function used to remove an ACME challenge response
 *
 * @param {object} authz Authorization object
 * @param {object} challenge Selected challenge
 * @param {string} keyAuthorization Authorization key
 * @returns {Promise}
 */

async function challengeRemoveFn(authz, challenge, keyAuthorization) {
	console.log('Triggered challengeRemoveFn()');

	/* http-01 */
	if (challenge.type === 'http-01') {
		const filePath = `/tmp/.well-known/acme-challenge/${challenge.token}`;
		console.log(`Removing challenge response for ${authz.identifier.value} at path: ${filePath}`);
		await fs.unlink(filePath);
	}

	/* dns-01 */
	else if (challenge.type === 'dns-01') {
		const parsed = psl.parse(authz.identifier.value);
		const domain = parsed.domain;
		let subdomain = '_acme-challenge';
		let caaSubdomain = '@';
		if (parsed.subdomain && parsed.subdomain.length > 0) {
			subdomain += `.${parsed.subdomain}`;
			caaSubdomain = parsed.subdomain;
		}
		const lock = await redlock.acquire([`lock:${domain}:${subdomain}`], 10000);
		const lock2 = await redlock.acquire([`lock:${domain}:${caaSubdomain}`], 10000);
		try {
			const recordValue = keyAuthorization;
			//TXT record
			console.log(`Removing TXT record "${subdomain}.${domain}" with value "${recordValue}"`);
			let recordSetRaw = await redis.hget(`dns:${domain}.`, subdomain);
			if (!recordSetRaw) {
				recordSetRaw = {};
			}
			recordSetRaw['txt'] = (recordSetRaw['txt']||[]).filter(r => r.text !== recordValue);
			if (recordSetRaw['txt'].length === 0) {
				await redis.hdel(`dns:${domain}.`, subdomain);
			} else {
				await redis.hset(`dns:${domain}.`, subdomain, recordSetRaw);
			}
			console.log(`Removed TXT record "${subdomain}.${domain}" with value "${recordValue}"`);
			//CAA record (testing)
			console.log(`Removing TXT record for "${caaSubdomain}.${domain}"`);
			let caaRecordSetRaw = await redis.hget(`dns:${domain}.`, caaSubdomain);
			if (!caaRecordSetRaw) {
				caaRecordSetRaw = {};
			}
			if (caaRecordSetRaw['caa']) {
				caaRecordSetRaw['caa'] = caaRecordSetRaw['caa'].filter(r => r.t === false);
			}
			if (!caaRecordSetRaw['caa'] || caaRecordSetRaw['caa'].length === 0) {
				delete caaRecordSetRaw['caa'];
			}
			await redis.hset(`dns:${domain}.`, caaSubdomain, caaRecordSetRaw);
			console.log(`Removed TXT record for "${caaSubdomain}.${domain}"`);
		} catch(e) {
			console.error(e);
		} finally {
			await lock.release();
			await lock2.release();
		}
	}
}

let _client;

export async function init() {
	_client = new acme.Client({
		directoryUrl: dev ? acme.directory.letsencrypt.staging : acme.directory.letsencrypt.production,
		accountKey: await acme.crypto.createPrivateKey()
	});
}

export async function generate(domain, altnames, email, challengePriority=['http-01', 'dns-01']) {
	/* Create CSR */
	const [key, csr] = await acme.crypto.createCsr({
		commonName: domain,
		altNames: altnames,
	});
	/* Certificate */
	const cert = await _client.auto({
		csr,
		email,
		termsOfServiceAgreed: true,
		skipChallengeVerification: true,
		challengeCreateFn,
		challengeRemoveFn,
		challengePriority,
	});
	/* Done */
	const haproxyCert = `${cert.toString()}\n${key.toString()}`;
	return { key, csr, cert, haproxyCert, date: new Date() };
}
