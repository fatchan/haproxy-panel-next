import 'dotenv/config';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

if (!process.env.LOKI_BASE_URL) {
	console.warn('process.env.LOKI_BASE_URL not set, loki pruner not running');
	process.exit(1);
}

import * as db from '../db.js';
const base64Auth = Buffer.from(`loki:${process.env.LOKI_AUTH}`).toString('base64');

async function main () {
	await db.connect();
	loop();
}

function getLokiDomains () {
	return fetch(`${process.env.LOKI_BASE_URL}/loki/api/v1/label/hh/values`, {
		withCredentials: true,
		credentials: 'include',
		headers: {
			'Authorization': `Basic ${base64Auth}`
		}
	})
		.then(res => res.json())
		.then(res => res.data);
}

function deleteLokiLabel (value, label = 'hh') {
	return fetch(`${process.env.LOKI_BASE_URL}/loki/api/v1/delete?query={${label}="${encodeURIComponent(value)}"}&start=1970-01-01T00:00:00.000Z`, {
		method: 'POST',
		withCredentials: true,
		credentials: 'include',
		headers: {
			'Authorization': `Basic ${base64Auth}`
		}
	});
}

async function loop () {
	try {
		const lokiDomains = await getLokiDomains();
		let userDomains = await db.db().collection('accounts')
			.find({}, { projection: { domains: 1 } })
			.toArray();
		userDomains = userDomains.reduce((acc, account) => {
			return acc.concat(account.domains || []);
		}, []);
		const userDomainsSet = new Set(userDomains);
		lokiDomains.forEach(d => {
			if (!userDomainsSet.has(d)) {
				console.log('Deleting loki logs for untracked domain', d);
				deleteLokiLabel(d);
			}
		});
	} catch (e) {
		console.error(e);
		setTimeout(loop, 60000);
		return;
	}
	setTimeout(loop, 3600000);
}

main();
