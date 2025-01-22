import * as crypto from 'crypto';
import { dynamicResponse } from '../util.js';
import * as db from '../db.js';

const generateStreamKey = (length = 64) => {
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
	console.log(req.body);

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
	let userName, appName, streamKey;
	if (match) {
		userName = match[1];
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

	const streamData = await db.db().collection('streams').findOne({
		userName,
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

	return dynamicResponse(req, res, 200, {});

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
	const streams = await db.db().collection('streams')
		.find({
			userName: res.locals.user.username,
		}) //TODO: should we project away stream keys here (and elsewhere) and only return from the add api?
		.toArray();
	res.locals.data = {
		user: res.locals.user,
		csrf: req.csrfToken(),
		streams: streams || [],
	};
	return app.render(req, res, '/streams');
};

//TODO: separate page and stream keys json, tab/sub pages/etc?

/**
 * GET /streams.json
 * stream keys json data
 */
export async function streamsJson(req, res) {
	const streams = await db.db().collection('streams')
		.find({
			userName: res.locals.user.username,
		}) //TODO: should we project away stream keys here (and elsewhere) and only return from the add api?
		.toArray();
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		streams: streams || [],
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

/**
 * POST /domain/delete
 * delete domain
 */
// export async function deleteDomain(req, res) {

// 	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0
// 		|| !res.locals.user.domains.includes(req.body.domain)) {
// 		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
// 	}

// 	const domain = req.body.domain.toLowerCase();

// 	//TODO: make loop through each cluster? or make domains per-cluster, hmmm
// 	const [existingHost, existingMaintenance, existingRewrite, existingDdos] = await Promise.all([
// 		res.locals.dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_HOSTS_MAP_NAME })
// 			.then(res => res.data).then(map => map.some(e => e.key === domain)),
// 		res.locals.dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME })
// 			.then(res => res.data).then(map => map.some(e => e.key === domain)),
// 		res.locals.dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_REWRITE_MAP_NAME })
// 			.then(res => res.data).then(map => map.some(e => e.key === domain)),
// 		res.locals.dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_DDOS_MAP_NAME })
// 			.then(res => res.data).then(map => map.some(e => {
// 				const { hostname } = url.parse(`https://${e.key}`);
// 				return hostname === domain;
// 			}))
// 	]);

// 	if (existingHost || existingMaintenance || existingRewrite || existingDdos) {
// 		return dynamicResponse(req, res, 400, { error: 'Cannot remove domain while still in use. Remove it from backends/maintenance/rewrites/protection first.' });
// 	}

// 	await db.db().collection('accounts')
// 		.updateOne({ _id: res.locals.user.username }, { $pull: { domains: domain } });
// 	await res.locals
// 		.dataPlaneAll('deleteRuntimeMapEntry', {
// 			map: process.env.NEXT_PUBLIC_DOMTOACC_MAP_NAME,
// 			id: domain,
// 		}, null, null, false, false);
// 	await redis.del(`dns:${domain}.`);

// 	return dynamicResponse(req, res, 302, { redirect: '/domains' });

// };
