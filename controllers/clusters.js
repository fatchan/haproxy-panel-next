import * as db from '../db.js';
import { validClustersString, makeArrayIfSingle, extractMap, dynamicResponse } from '../util.js';

export async function clustersPage(app, req, res, next) {
	res.locals.data = {
		user: res.locals.user,
		csrf: req.csrfToken(),
	}
	return app.render(req, res, '/clusters');
};

export async function clustersJson(req, res, next) {
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
	});
};

/**
 * POST /cluster
 * set active cluster
 */
export async function setCluster(req, res, next) {
	if (res.locals.user.username !== 'admin') {
		return dynamicResponse(req, res, 403, { error: 'Changing cluster is only supported on enterprise plans' });
	}
	if (req.body == null || req.body.cluster == null) {
		return dynamicResponse(req, res, 404, { error: 'Invalid cluster' });
	}
	req.body.cluster = parseInt(req.body.cluster, 10) || 0;
	if (!Number.isSafeInteger(req.body.cluster)
		|| req.body.cluster > res.locals.user.clusters.length-1) {
		return dynamicResponse(req, res, 404, { error: 'Invalid cluster' });
	}
	try {
		await db.db().collection('accounts')
			.updateOne({_id: res.locals.user.username}, {$set: {activeCluster: req.body.cluster }});
	} catch (e) {
		return next(e);
	}
	return dynamicResponse(req, res, 302, { redirect: '/account' });
};

/**
 * POST /cluster/add
 * add cluster
 */
export async function addCluster(req, res, next) {
	if (res.locals.user.username !== 'admin') {
		return dynamicResponse(req, res, 403, { error: 'Adding clusters is only supported on enterprise plans' });
	}
	if (!req.body || !req.body.cluster
		|| typeof req.body.cluster !== 'string'
		|| !validClustersString(req.body.cluster)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid cluster' });
	}
	try {
		await db.db().collection('accounts')
			.updateOne({_id: res.locals.user.username}, {$addToSet: {clusters: req.body.cluster }});
	} catch (e) {
		return next(e);
	}
	return dynamicResponse(req, res, 302, { redirect: '/clusters' });
};

/**
 * POST /cluster/delete
 * delete cluster
 */
export async function deleteClusters(req, res, next) {
	if (res.locals.user.username !== 'admin') {
		return dynamicResponse(req, res, 403, { error: 'Removing clusters is only supported on enterprise plans' });
	}
	//TODO: warning modal and extra "confirm" param before deleting cluster
	const existingClusters = new Set(res.locals.user.clusters);
	req.body.cluster = makeArrayIfSingle(req.body.cluster);
	if (!req.body || !req.body.cluster
		|| !req.body.cluster.some(c => existingClusters.has(c))) {
		return dynamicResponse(req, res, 400, { error: 'Invalid cluster' });
	}
	const filteredClusters = res.locals.clusters.filter(c => !req.body.cluster.includes(c));
	// if (filteredClusters.length === 0) {
		// return dynamicResponse(req, res, 400, { error: 'Cannot delete last cluster' });
	// }
	let newActiveCluster = res.locals.user.activeCluster;
	if (res.locals.user.activeCluster > filteredClusters.length-1) {
		newActiveCluster = 0;
	}
	try {
		await db.db().collection('accounts')
			.updateOne({_id: res.locals.user.username}, {$set: {clusters: filteredClusters, activeCluster: newActiveCluster }});
	} catch (e) {
		return next(e);
	}
	return dynamicResponse(req, res, 302, { redirect: '/clusters' });
};
