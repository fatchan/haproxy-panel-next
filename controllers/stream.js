import * as crypto from 'crypto';
import { dynamicResponse } from '../util.js';
import * as db from '../db.js';
import * as redis from '../redis.js';
import { ObjectId } from 'mongodb';
const appNameRegex = /^\/app\/([a-zA-Z0-9-_]+)\+([a-zA-Z0-9-_]+)$/;

const generateRandomString = (length = 32) => {
	const bytes = crypto.randomBytes(length / 2); // Each byte is represented by 2 hex characters
	return bytes.toString('hex');
};

const validateSignature = (payload, signature) => {
	const secretKey = process.env.OME_WEBHOOK_SECRET || 'changeme';
	const hmac = crypto.createHmac('sha1', secretKey);
	hmac.update(JSON.stringify(payload));
	const expectedSignature = hmac.digest('base64url');
	return expectedSignature === signature; //todo: time safe compare
};

/**
 * POST /stream/alert-webhook
 * oven media engine admissionswebhook handler
 */
export async function alertWebhook(req, res) {
	//NOTE: follows response format for ovenmedia engine
	const signature = req.headers['x-ome-signature'];
	const payload = req.body;

	console.log('alertWebhook payload:', payload);

	if (!validateSignature(payload, signature)) {
		return res.status(401).json({});
	}

	// reply early with blank json
	res.status(200).json({});

	const { sourceUri } = payload;

	const sourceAppString = sourceUri.replace(/^#default#/, '/');

	const match = sourceAppString.match(appNameRegex);
	let streamsId, appName;
	if (match) {
		streamsId = match[1];
		appName = match[2];
	} else {
		return console.warn('Invalid sourceAppString in alertWebhook:', sourceAppString);
	}

	const streamsIdAccount = await db.db().collection('accounts').findOne({
		streamsId,
	}, {
		projection: {
			_id: 1,
		}
	});

	if (!streamsIdAccount) {
		return res.status(200).json({
			allowed: false,
			reason: 'Invalid stream account id'
		});
	}

	const streamsIdUsername = streamsIdAccount._id.toString();

	const streamData = await db.db().collection('streams').findOne({
		userName: streamsIdUsername,
		appName,
	});

	if (!streamData) {
		return console.warn('Alert webhook received for missing stream', { streamsId, streamsIdUsername, appName });
	}

	const streamsIdWebhooks = await db.db().collection('streamwebhooks')
		.find({
			username: streamsIdUsername,
			type: 'alert',
		})
		.toArray();

	Promise.all(streamsIdWebhooks.map(async wh => {
		const webhookBody = payload.request;
		const jsonBody = JSON.stringify(webhookBody);
		const signature = crypto.createHmac('sha256', wh.signingSecret)
			.update(jsonBody)
			.digest('hex');
		return fetch(wh.url, {
			method: 'POST',
			redirect: 'manual', //Dont follow user link redirects
			body: webhookBody,
			headers: {
				'Content-Type': 'application/json',
				'x-bf-signature': signature
			},
		});
	})); //Note: async

};

/**
 * POST /stream/admissions-webhook
 * oven media engine admissionswebhook handler
 */
export async function admissionsWebhook(req, res) {
	//NOTE: follows response format for ovenmedia engine
	const signature = req.headers['x-ome-signature'];
	const payload = req.body;

	console.log('admissionsWebhook payload:', payload);

	if (!validateSignature(payload, signature)) {
		return res.status(200).json({
			allowed: false,
			reason: 'Invalid stream url'
		});
	}

	const { request } = payload;
	const { url: streamUrl, direction } = request;

	const parsedUrl = new URL(streamUrl);
	if (parsedUrl.pathname.startsWith('//')) {
		// Strip double leading slashes from e.g. restream in case of bad url
		parsedUrl.pathname = parsedUrl.pathname.substring(1);
	}
	// console.log('parsedUrl', parsedUrl);

	const match = parsedUrl.pathname.match(appNameRegex);
	// console.log('match', match);
	let streamsId, appName, streamKey;
	if (match) {
		streamsId = match[1];
		appName = match[2];
		streamKey = parsedUrl.searchParams.get('key');
	} else {
		return res.status(200).json({
			allowed: false,
			reason: 'Invalid stream url'
		});
	}

	if (direction === 'outgoing') {
		return res.status(200).json({
			allowed: true,
		});
	}

	const streamsIdAccount = await db.db().collection('accounts').findOne({
		streamsId,
	}, {
		projection: {
			_id: 1,
		}
	});

	// console.log('streamsIdAccount', streamsIdAccount);

	if (!streamsIdAccount) {
		return res.status(200).json({
			allowed: false,
			reason: 'Invalid stream account id'
		});
	}

	const streamsIdUsername = streamsIdAccount._id.toString();

	const streamData = await db.db().collection('streams').findOne({
		userName: streamsIdUsername,
		appName,
		streamKey,
	});

	// console.log('streamData', streamData);

	const isAllowed = streamData != null;

	// console.log('status is opening', parsedUrl);
	if (isAllowed) {

		const streamsIdWebhooks = await db.db().collection('streamwebhooks')
			.find({
				username: streamsIdUsername,
				type: 'admissions',
			})
			.toArray();

		Promise.all(streamsIdWebhooks.map(async wh => {
			const webhookBody = payload.request;
			const jsonBody = JSON.stringify(webhookBody);
			const signature = crypto.createHmac('sha256', wh.signingSecret)
				.update(jsonBody)
				.digest('hex');
			return fetch(wh.url, {
				method: 'POST',
				redirect: 'manual', //Dont follow user link redirects
				body: webhookBody,
				headers: {
					'Content-Type': 'application/json',
					'x-bf-signature': signature
				},
			});
		})); //Note: async

		return res.status(200).json({
			allowed: true,
			new_url: parsedUrl,
			lifetime: 0, // 0 means infinity
			reason: 'authorized'
		});
	} else {
		return res.status(200).json({
			allowed: false,
			reason: 'Invalid stream key'
		});
	}

};

/**
 * POST /stream/:id/conclude
 * force end a stream
 */
export async function concludeStream(req, res, _next) {

	if (req.params.id || typeof req.params.id !== 'string' || req.params.id.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input1' });
	}

	const concludingStream = await db.db().collection('streams')
		.findOne({
			userName: res.locals.user.username,
			_id: ObjectId(req.params.id),
		});
	console.log(concludingStream);
	if (!concludingStream) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input2' });
	}

	const appName = concludingStream?.appName;

	res.locals.ovenMediaConclude(res.locals.user.streamsId, appName);

	return dynamicResponse(req, res, 200, {});

}

/**
 * GET /streams
 * domains page
 */
export async function streamsPage(app, req, res) {
	//TODO: streamsData() func  refactor
	const [streamKeys, streamWebhooks, streams] = await Promise.all([
		db.db().collection('streams')
			.find({
				userName: res.locals.user.username,
			}) //TODO: should we project away stream keys here (and elsewhere) and only return from the add api?
			.toArray(),
		db.db().collection('streamwebhooks')
			.find({
				username: res.locals.user.username
			})
			.toArray(),
		redis.getKeysPattern(`app/${res.locals.user.streamsId}+*`)
	]);
	res.locals.data = {
		user: res.locals.user,
		csrf: req.csrfToken(),
		streams: streams || [],
		streamKeys: streamKeys || [],
		streamWebhooks: streamWebhooks || [],
	};
	return app.render(req, res, '/streams');
};

/**
 * GET /streams.json
 * stream keys json data
 */
export async function streamsJson(req, res) {
	const [streamKeys, streamWebhooks, streams] = await Promise.all([
		db.db().collection('streams')
			.find({
				userName: res.locals.user.username,
			}) //TODO: should we project away stream keys here (and elsewhere) and only return from the add api?
			.toArray(),
		db.db().collection('streamwebhooks')
			.find({
				username: res.locals.user.username
			})
			.toArray(),
		redis.getKeysPattern(`app/${res.locals.user.streamsId}+*`)
	]);
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		streams: streams || [],
		streamKeys: streamKeys || [],
		streamWebhooks: streamWebhooks || [],
	});
};

/**
 * POST /stream/add
 * add stream key
 */
export async function addStream(req, res, _next) {

	if (!req.body.appName || typeof req.body.appName !== 'string' || req.body.appName.length === 0 || !/[a-zA-Z0-9-_]+/.test(req.body.appName)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const existingStream = await db.db().collection('streams')
		.findOne({
			userName: res.locals.user.username,
			appName: req.body.appName,
		});

	if (existingStream) {
		return dynamicResponse(req, res, 409, { error: 'Stream key with this name already exists' });
	}

	const streamKey = generateRandomString();

	db.db().collection('streams')
		.insertOne({
			userName: res.locals.user.username,
			appName: req.body.appName,
			dateCreated: new Date(),
			streamKey,
		});

	return dynamicResponse(req, res, 200, { streamKey });

};

/**
 * DELETE /stream/:id
 * delete stream key
 */
export async function deleteStream(req, res, _next) {

	if (!req.params.id || typeof req.params.id !== 'string' || req.params.id.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const deletedStream = await db.db().collection('streams')
		.findOneAndDelete({
			userName: res.locals.user.username,
			_id: ObjectId(req.params.id),
		});

	console.log(deletedStream);

	if (!deletedStream?.value) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	res.locals.ovenMediaConclude(res.locals.user.streamsId, deletedStream.value.appName);

	return dynamicResponse(req, res, 200, {});

};

/**
 * POST /stream/webhook
 * Set the callback URL and (re)generates the signing secret
 */
export async function addStreamWebhook(req, res, _next) {

	if (!req.body.url || typeof req.body.url !== 'string' || req.body.url.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	if (!req.body.type || typeof req.body.type !== 'string' || !['alert', 'admissions'].includes(req.body.type)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	try {
		new URL(req.body.url); //Not perfect
	} catch (e) {
		console.warn('Bad URL for generateStreamWebhook, url:', req.body.url, 'Error:', e);
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const webhookSecret = generateRandomString(64);

	db.db().collection('streamwebhooks')
		.insertOne({
			username: res.locals.user.username,
			dateCreated: new Date(),
			url: req.body.url,
			type: req.body.type,
			signingSecret: webhookSecret,
		});

	return dynamicResponse(req, res, 200, { });

};

/**
 * POST /stream/webhook/:id
 * add stream key
 */
export async function deleteStreamWebhook(req, res, _next) {

	if (!req.params.id || typeof req.params.id !== 'string' || req.params.id.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	db.db().collection('streamwebhooks')
		.deleteOne({
			username: res.locals.user.username,
			_id: ObjectId(req.params.id),
		});

	return dynamicResponse(req, res, 200, { });

};
