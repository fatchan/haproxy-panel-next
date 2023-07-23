'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const db = require('../db.js');

async function main() {
	await db.connect();
	loop();
}

const getCertsOlderThan = (days=60) => db.db.collection('certs')
	.find({
		date: {
			'$lt': new Date(new Date().setDate(new Date().getDate()-days))
		},
	}, {
		date: 1,
		subject: 1,
		altnames: 1,
	})
	.toArray();

async function loop() {
	try {
		const expiringCerts = await getCertsOlderThan(60);
		expiringCerts.forEach(c => {
			console.log('Renewing cert that expires', new Date(new Date(c.date).setDate(new Date(c.date).getDate()+90)), 'for', c.subject, c.altnames.toString());
			//TODO
		});
	} catch(e) {
		console.error(e);
		setTimeout(loop, 60000);
		return;
	}
	setTimeout(loop, 3600000);
}

main();
