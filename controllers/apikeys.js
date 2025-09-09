import * as crypto from 'crypto';
import { dynamicResponse } from '../util.js';
import * as db from '../db.js';
import { ObjectId } from 'mongodb';

const generateApiKey = (length = 64) => {
	const bytes = crypto.randomBytes(length / 2); // Each byte is represented by 2 hex characters
	return bytes.toString('hex');
};

/**
 * GET /apikeys
 * api keys page
 */
export async function apiKeysPage(app, req, res) {
	if (res.locals.isApiKey) {
		return dynamicResponse(req, res, 403, { error: 'API keys cannot access API keys' });
	}
	const originalUser = res.locals.originalUser;
	const apiKeys = await db.db().collection('apikeys')
		.find({
			username: originalUser.username,
		}, {
			projection: {
				key: 0, //hide the key
			}
		})
		.toArray();
	res.locals.data = {
		user: originalUser,
		csrf: req.csrfToken(),
		apiKeys: apiKeys || [],
		impersonating: res.locals.originalUser.username !== res.locals.user.username,
	};
	return app.render(req, res, '/apikeys');
};

/**
 * GET /apikeys.json
 * stream keys json data
 */
export async function apiKeysJson(req, res) {
	if (res.locals.isApiKey) {
		return dynamicResponse(req, res, 403, { error: 'API keys cannot access API keys' });
	}
	const originalUser = res.locals.originalUser;
	const apiKeys = await db.db().collection('apikeys')
		.find({
			username: originalUser.username,
		}, {
			projection: {
				key: 0,
			}
		})
		.toArray();
	return res.json({
		csrf: req.csrfToken(),
		user: originalUser,
		apiKeys: apiKeys || [],
		impersonating: res.locals.originalUser.username !== res.locals.user.username,
	});
};

/**
 * POST /apikeys/add
 * add stream key
 */
export async function addApiKey(req, res, _next) {
	if (res.locals.isApiKey) {
		return dynamicResponse(req, res, 403, { error: 'API keys cannot access API keys' });
	}

	const originalUser = res.locals.originalUser;

	if (!req.body.label || typeof req.body.label !== 'string' || req.body.label.length === 0 || req.body.label.length > 1000) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const { label } = req.body;

	const key = generateApiKey();

	db.db().collection('apikeys')
		.insertOne({
			username: originalUser.username,
			label,
			dateCreated: new Date(),
			key,
		});

	return dynamicResponse(req, res, 200, { key });

};

/**
 * POST /apikeys/delete
 * delete stream key
 */
export async function deleteApiKey(req, res, _next) {
	if (res.locals.isApiKey) {
		return dynamicResponse(req, res, 403, { error: 'API keys cannot access API keys' });
	}

	const originalUser = res.locals.originalUser;

	if (!req.body.keyId || typeof req.body.keyId !== 'string' || req.body.keyId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	db.db().collection('apikeys')
		.deleteOne({
			_id: ObjectId(req.body.keyId),
			username: originalUser.username,
		});

	return dynamicResponse(req, res, 200, {});

};
