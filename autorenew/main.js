'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import * as db from '../db.js';
import FormData from 'form-data';
import agent from '../agent.js';
import * as acme from '../acme.js';
import { trimmedNsHosts } from '../templates.js';
import fetch from 'node-fetch';
import { Resolver } from 'node:dns/promises';
import psl from 'psl';

const resolver = new Resolver();
resolver.setServers(process.env.NAMESERVERS.split(','));

const clusterUrls = process.env.DEFAULT_CLUSTER.split(',').map(u => new URL(u))
	, firstClusterURL = clusterUrls[0]
	, base64Auth = Buffer.from(`${firstClusterURL.username}:${firstClusterURL.password}`).toString('base64');

async function main () {
	await db.connect();
	await acme.init();
	loop();
}

function getCertsOlderThan (days = 60) {
	return db.db().collection('certs')
		.find({
			// _id: '*.zeroddos.net',
			date: {
				'$lt': new Date(new Date().setDate(new Date().getDate() - days))
			},
		}, {
			date: 1,
			subject: 1,
			altnames: 1,
		})
		.toArray();
}

async function postFileAll (path, options, file, fdOptions) {
	const promiseResults = await Promise.all(clusterUrls.map(clusterUrl => {
		const fd = new FormData();
		fd.append('file_upload', file, fdOptions);
		return fetch(`${clusterUrl.origin}${path}`, { ...options, body: fd, agent }).then(resp => resp.json());
	}));
	return promiseResults[0];
}

async function updateCert (dbCert) {
	const { subject, altnames } = dbCert;
	console.log('Renew cert request:', subject, altnames);
	const { csr, key, cert, haproxyCert, date } = await acme.generate(subject, altnames, ['dns-01', 'http-01']);
	const { message, description, file, storage_name: storageName } = await postFileAll('/v3/services/haproxy/storage/ssl_certificates', {
		method: 'POST',
		headers: {
			'authorization': `Basic ${base64Auth}`,
		},
	}, haproxyCert, {
		filename: `${subject}.pem`,
		contentType: 'text/plain',
	}
	);
	if (message) {
		return console.error('Problem renewing', subject, altnames, 'message:', message);
	}
	let update = {
		_id: subject,
		subject: subject,
		altnames: altnames,
		csr, key, cert, haproxyCert, // cert creation data
		date,
	};
	if (description) {
		//may be null due to "already exists", so we keep existing props
		update = { ...update, description, file, storageName };
	}
	await db.db().collection('certs')
		.updateOne({
			'_id': subject,
		}, {
			'$set': update,
		}, {
			'upsert': true,
		});
}

async function loop () {
	try {
		const expiringCerts = await getCertsOlderThan(60);
		if (expiringCerts.length === 0) {
			console.log('No certs close to expiry');
		}
		for (const c of expiringCerts) {
			console.log('Renewing cert that expires', new Date(new Date(c.date).setDate(new Date(c.date).getDate() + 90)), 'for', c.subject, c.altnames.toString());
			const rootDomain = psl.parse(c.subject.replace('*', 'x')).domain;
			let certDomainNameservers = [];
			try {
				certDomainNameservers = await resolver.resolve(rootDomain, 'NS');
			} catch (e) {
				console.warn(e); //probably just no NS records, bad domain
				certDomainNameservers = null;
			}
			if (!certDomainNameservers
				|| !trimmedNsHosts.some(nsHost => certDomainNameservers.includes(nsHost))) {
				console.warn('Skipping', rootDomain, 'renewal because of incorrect NS records:', certDomainNameservers);
			} else {
				await updateCert(c);
				await new Promise(res => setTimeout(res, 5000));
			}
		}
	} catch (e) {
		console.error(e);
		console.log('Sleeping for', 60000);
		if (process.env.AUTORENEW_WARNING_ENDPOINT) {
			fetch(process.env.AUTORENEW_WARNING_ENDPOINT)
				.then(res => console.log('sending autorenew warning, status:', res.status))
				.catch(err => console.error(err));
		}
		return process.exit(1);
	}
	console.log('Sleeping for', 3600000);
	setTimeout(loop, 3600000);
}

main();
