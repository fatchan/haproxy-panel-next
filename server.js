'use strict';

process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });

import express from 'express';
import next from 'next';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import * as acme from './acme.js';
import * as redis from './redis.js';
import * as db from './db.js';
import router from './router.js';

const dev = process.env.NODE_ENV !== 'production'
	, hostname = 'localhost'
	, port = 3000
	, app = next({ dev, hostname, port })
	, handle = app.getRequestHandler();

app.prepare()
	.then(async () => {

		await db.connect();
		await acme.init();

		const server = express();
		server.set('query parser', 'simple');
		server.use(bodyParser.json({ extended: false })); // for parsing application/json
		server.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded
		server.use(cookieParser(process.env.COOKIE_SECRET));
		server.disable('x-powered-by');
		server.set('trust proxy', 1);
		server.use('/.well-known/acme-challenge', express.static('/tmp/.well-known/acme-challenge'));

		router(server, app);

		server.get('*', (req, res) => {
			return handle(req, res);
		});

		server.use((err, _req, res, _next) => {
			const now = Date.now();
			console.error('An error occurred', now, err);
			return res.send('An error occurred. Please contact support with code: '+now);
		});

		server.listen(3000, (err) => {
			if (err) {
				throw err;
			}
			if (typeof process.send === 'function') {
				console.log('SENT READY SIGNAL TO PM2');
				process.send('ready');
			}
			console.log('> Ready on http://localhost:3000');
		});

		const gracefulStop = () => {
			console.log('SIGINT SIGNAL RECEIVED');
			db.client.close();
			redis.close();
			process.exit(0);
		};
		process.on('SIGINT', gracefulStop);
		process.on('message', (message) => {
			if (message === 'shutdown') {
				gracefulStop();
			}
		});

	})
	.catch(err => {
		console.error(err.stack);
		process.exit(1);
	});
