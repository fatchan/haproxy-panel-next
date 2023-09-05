'use strict';

const fs = require('fs').promises;
const acme = require('acme-client');
const dev = process.env.NODE_ENV !== 'production';
const redis = require('./redis.js');
const redlock = require('./redlock.js');
const psl = require('psl');


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
		let subdomain = `_acme-challenge`;
		if (parsed.subdomain && parsed.subdomain.length > 0) {
			subdomain += `.${parsed.subdomain}`;
		}
		const lock = await redlock.acquire([`lock:${domain}:${subdomain}`], 10000);
		try {
			const recordValue = keyAuthorization;
			console.log(`Creating TXT record for "${subdomain}.${domain}" with value "${recordValue}"`);
			const record = { ttl: 300, text: recordValue, l: true, t: true };
			let recordSetRaw = await redis.hget(`dns:${domain}.`, subdomain);
			if (!recordSetRaw) {
				recordSetRaw = {};
			}
			recordSetRaw['txt'] = (recordSetRaw['txt']||[]).concat([record]);
			await redis.hset(`dns:${domain}.`, subdomain, recordSetRaw);
			console.log(`Created TXT record for "${subdomain}.${domain}" with value "${recordValue}"`);
		} catch(e) {
			console.error(e);
		} finally {
			await lock.release();
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
		let subdomain = `_acme-challenge`;
		if (parsed.subdomain && parsed.subdomain.length > 0) {
			subdomain += `.${parsed.subdomain}`;
		}
		const lock = await redlock.acquire([`lock:${domain}:${subdomain}`], 10000);
		try {
			const recordValue = keyAuthorization;
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
		} catch(e) {
			console.error(e);
		} finally {
			await lock.release();
		}
	}
}



module.exports = {

	client: null,

	init: async function() {
		/* Init client */
		module.exports.client = new acme.Client({
			directoryUrl: dev ? acme.directory.letsencrypt.staging : acme.directory.letsencrypt.production,
			accountKey: await acme.crypto.createPrivateKey()
		});
	},

	generate: async function(domain, altnames, email, challengePriority=['http-01', 'dns-01']) {
		/* Create CSR */
		const [key, csr] = await acme.crypto.createCsr({
			commonName: domain,
			altNames: altnames,
		});
		/* Certificate */
		const cert = await module.exports.client.auto({
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
	},

};
