'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Queue from 'bull';

const haproxyStatsQueue = new Queue('stats', { redis: {
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
	password: process.env.REDIS_PASS || '',
	db: 1,
}});

if (!process.env.INFLUX_HOST) {
	console.error('INFLUX_HOST not set, statistics will not be recorded');
	process.exit(1);
}

let clusterUrls = [];

const base64Auth = Buffer.from(`${process.env.AUTODISCOVER_USER}:${process.env.AUTODISCOVER_PASS}`).toString('base64');
const fetchOptions = {
	headers: {
		'Authorization': `Basic ${base64Auth}`,
	}
};

async function autodiscover() {
	try {
		fetch(`${process.env.AUTODISCOVER_HOST}/v1/autodiscover`, fetchOptions)
			.then(res => res.json())
			.then(json => {
				console.log('Autodiscovered found %d hosts', json.length);
				clusterUrls = json.map(h => (new URL(`https://${process.env.DATAPLANE_USER}:${process.env.DATAPLANE_PASS}@${h.hostname}:2001/`)));
			});
	} catch(e) {
		console.error(e);
	}
}

async function main() {
	try {
		console.log('Collecting stats for %d nodes', clusterUrls.length);
		clusterUrls.forEach(cu => {
			//group to a certain amount in each array? ehh probs not
			haproxyStatsQueue.add({ hosts: [cu] }, { removeOnComplete: true });
		});
	} catch(e) {
		console.error(e);
	}
}

autodiscover()
	.then(() => main());
setInterval(autodiscover, 60000);
setInterval(main, 10000);
