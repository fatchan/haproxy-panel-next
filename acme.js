'use strict';

const fs = require('fs').promises;
const acme = require('acme-client');
const dev = process.env.NODE_ENV !== 'production';
const redis = require('./redis.js');

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

	/* http-01 */
	if (challenge.type === 'http-01') {
		const filePath = `/tmp/.well-known/acme-challenge/${challenge.token}`;
		const fileContents = keyAuthorization;
		console.log(`Creating challenge response for ${authz.identifier.value} at path: ${filePath}`);
		await fs.writeFile(filePath, fileContents);
	}

	/* dns-01 */
	else if (challenge.type === 'dns-01') {
		const dnsRecord = `_acme-challenge.${authz.identifier.value}`;
		const recordValue = keyAuthorization;
		console.log(`Creating TXT record for ${authz.identifier.value}: ${dnsRecord}`);
		const record = { ttl: 300, text: recordValue, l: true, t: true };
		let recordSetRaw = await redis.hget(`dns:${authz.identifier.value}.`, '_acme-challenge');
		if (!recordSetRaw) {
			recordSetRaw = {};
		}
		recordSetRaw['txt'] = [record];
		await redis.hset(`dns:${authz.identifier.value}.`, '_acme-challenge', recordSetRaw);
		console.log(`Created TXT record "${dnsRecord}" with value "${recordValue}"`);
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
		const dnsRecord = `_acme-challenge.${authz.identifier.value}`;
		const recordValue = keyAuthorization;
		console.log(`Removing TXT record for ${authz.identifier.value}: ${dnsRecord}`);
		await redis.hdel(`dns:${authz.identifier.value}.`, '_acme-challenge');
		console.log(`Removed TXT record "${dnsRecord}" with value "${recordValue}"`);
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

	generate: async function(domain, altnames, email) {
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
			challengeRemoveFn
		});
		/* Done */
		const haproxyCert = `${cert.toString()}\n${key.toString()}`;
		return { key, csr, cert, haproxyCert, date: new Date() };
	},

};
