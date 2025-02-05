import * as crypto from 'crypto';
import { dynamicResponse } from '../util.js';
import * as db from '../db.js';
import * as redis from '../redis.js';

const generateStreamKey = (length = 32) => {
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
 * POST /stream/admissions-webhook
 * oven media engine admissionswebhook handler
 */
export async function admissionsWebhook(req, res) {
	//NOTE: follows response format for ovenmedia engine
	const signature = req.headers['x-ome-signature'];
	const payload = req.body;

	if (!validateSignature(payload, signature)) {
		return res.status(403).json({ error: 'Invalid signature' });
	}

	console.log('payload:', payload);

	const { request } = payload;
	const { url: streamUrl, direction, status } = request;

	const parsedUrl = new URL(streamUrl);

	const regex = /^\/app\/([a-zA-Z0-9-_]+):([a-zA-Z0-9-_]+)$/;
	const match = parsedUrl.pathname.match(regex);
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

	if (!streamsIdAccount) {
		return res.status(200).json({
			allowed: false,
			reason: 'Invalid stream account id'
		});
	}

	const streamData = await db.db().collection('streams').findOne({
		userName: streamsIdAccount._id,
		appName,
		streamKey,
	});

	const isAllowed = streamData != null;

	if (status === 'opening') {
		if (isAllowed) {
			return res.status(200).json({
				allowed: true,
				new_url: streamUrl, //optional
				lifetime: 0, // 0 means infinity
				reason: 'authorized'
			});
		} else {
			return res.status(200).json({
				allowed: false,
				reason: 'Invalid stream key'
			});
		}
	} else if (status === 'closing') {
		return res.status(200).json({});
	}

	return res.status(400).json({ error: 'Invalid status' });

};

/**
 * GET /stream/apps
 * stream list (asks oven media engine then filters)
 */
export async function listApps(req, res, _next) {

	//todo: make ovenmedia api a middleware i.e useOvenMedia
	const streams = await redis.getKeysPattern(`app/${res.locals.user.streamsId}:*`);

	return dynamicResponse(req, res, 200, { streams });

}

/**
 * POST /stream/conclude
 * force end a stream
 */
export async function concludeStream(req, res, _next) {

	//todo: make ovenmedia api a middleware i.e useOvenMedia

	return dynamicResponse(req, res, 200, {});

}

/**
 * GET /streams
 * domains page
 */
export async function streamsPage(app, req, res) {
	const streamKeys = await db.db().collection('streams')
		.find({
			userName: res.locals.user.username,
		}) //TODO: should we project away stream keys here (and elsewhere) and only return from the add api?
		.toArray();
	const streams = await redis.getKeysPattern(`app/${res.locals.user.username}:*`);
	res.locals.data = {
		user: res.locals.user,
		csrf: req.csrfToken(),
		streams: streams || [],
		streamKeys: streamKeys || [],
	};
	return app.render(req, res, '/streams');
};

//TODO: separate page and stream keys json, tab/sub pages/etc?

/**
 * GET /streams.json
 * stream keys json data
 */
export async function streamsJson(req, res) {
	const streamKeys = await db.db().collection('streams')
		.find({
			userName: res.locals.user.username,
		}) //TODO: should we project away stream keys here (and elsewhere) and only return from the add api?
		.toArray();
	const streams = await redis.getKeysPattern(`app/${res.locals.user.username}:*`);
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		streams: streams || [],
		streamKeys: streamKeys || [],

	});
};

/**
 * POST /stream/add
 * add stream key
 */
export async function addStream(req, res, _next) {

	if (!req.body.appName || typeof req.body.appName !== 'string' || req.body.appName.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const streamKey = generateStreamKey();

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
 * POST /stream/delete
 * delete stream key
 */
export async function deleteStream(req, res, _next) {

	if (!req.body.appName || typeof req.body.appName !== 'string' || req.body.appName.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	db.db().collection('streams')
		.deleteOne({
			userName: res.locals.user.username,
			appName: req.body.appName,
		});

	return dynamicResponse(req, res, 200, {});

};
