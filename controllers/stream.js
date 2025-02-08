import * as crypto from 'crypto';
import { dynamicResponse } from '../util.js';
import * as db from '../db.js';
import * as redis from '../redis.js';
const edgeDomains = process.env.OME_EDGE_HOSTNAMES.split(',').map(x => x.trim());
const appNameRegex = /^\/app\/([a-zA-Z0-9-_]+)\+([a-zA-Z0-9-_]+)$/;
const omeAuthHeader = Buffer.from(process.env.OME_API_SECRET).toString('base64');

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

	console.log('OME payload:', payload);

	if (!validateSignature(payload, signature)) {
		return res.status(200).json({
			allowed: false,
			reason: 'Invalid stream url'
		});
	}

	const { request } = payload;
	const { url: streamUrl, direction, status } = request;

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

	const streamData = await db.db().collection('streams').findOne({
		userName: streamsIdAccount._id.toString(),
		appName,
		streamKey,
	});

	// console.log('streamData', streamData);

	const isAllowed = streamData != null;

	if (status === 'opening') {
		// console.log('status is opening', parsedUrl);
		if (isAllowed) {
			console.log('ALLOWING', streamUrl);
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
	}

	return res.status(200).json({
		allowed: 'true',
		reason: 'Closing'
	});

};

/**
 * GET /stream/apps
 * stream list (asks oven media engine then filters)
 */
export async function listApps(req, res, _next) {

	//todo: make ovenmedia api a middleware i.e useOvenMedia
	const streams = await redis.getKeysPattern(`app/${res.locals.user.streamsId}+*`);

	return dynamicResponse(req, res, 200, { streams });

}

/**
 * POST /stream/conclude
 * force end a stream
 */
export async function concludeStream(req, res, _next) {

	if (!req.body.appName || typeof req.body.appName !== 'string' || req.body.appName.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const match = `/${req.body.appName}`.match(appNameRegex);
	let streamsId, appName;
	if (match) {
		streamsId = match[1];
		appName = match[2];
	} else {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	if (streamsId !== res.locals.user.streamsId) {
		// cant end another bf users streams
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	// console.log(match, streamsId, appName);

	edgeDomains.forEach(d => fetch(`https://${d}/api/v1/vhosts/default/apps/app/streams/${res.locals.user.streamsId}+${appName}:concludeHlsLive`, {
		method: 'POST',
		headers: {
			'Authorization': `Basic ${omeAuthHeader}`,
		}
	}));

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
	const streams = await redis.getKeysPattern(`app/${res.locals.user.streamsId}+*`);
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
	const streams = await redis.getKeysPattern(`app/${res.locals.user.streammsId}+*`);
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

	if (!req.body.id || typeof req.body.id !== 'string' || req.body.id.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	db.db().collection('streams')
		.deleteOne({
			userName: res.locals.user.username,
			_id: ObjectId(req.body.id),
		});

	return dynamicResponse(req, res, 200, {});

};
