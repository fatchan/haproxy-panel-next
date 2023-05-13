const db = require('../db.js');
const acme = require('../acme.js');
const url = require('url');
const { dynamicResponse } = require('../util.js');

/**
 * GET /domains
 * domains page
 */
exports.domainsPage = async (app, req, res) => {
	const certs = await db.db.collection('certs')
		.find({
			username: res.locals.user.username,
		}, {
			projection: {
				_id: 1,
				subject: 1,
				altnames: 1,
				date: 1,
				storageName: 1,
			}
		})
		.toArray();
	certs.forEach(c => c.date = c.date.toISOString())
	return app.render(req, res, '/domains', {
		csrf: req.csrfToken(),
		certs,
	});
};

/**
 * GET /domains.json
 * domains json data
 */
exports.domainsJson = async (req, res) => {
	const certs = await db.db.collection('certs')
		.find({
			username: res.locals.user.username,
		}, {
			projection: {
				_id: 1,
				subject: 1,
				altnames: 1,
				date: 1,
				storageName: 1,
			}
		})
		.toArray();
	certs.forEach(c => c.date = c.date.toISOString())
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		certs,
	});
};

/**
 * POST /domain/add
 * add domain
 */
exports.addDomain = async (req, res, next) => {

	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const domain = req.body.domain.toLowerCase();

	try {
		const { hostname } = url.parse(`https://${domain}`);
	} catch (e) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	try {
		const existing = await db.db.collection('accounts')
			.findOne({ domains: domain });
		if (existing) {
			return dynamicResponse(req, res, 400, { error: 'This domain is already in use' });
		}
		await db.db.collection('accounts')
			.updateOne({_id: res.locals.user.username}, {$addToSet: {domains: domain }});
	} catch (e) {
		return next(e);
	}

	return dynamicResponse(req, res, 302, { redirect: req.body.onboarding ? '/onboarding' : '/domains' });

};

/**
 * POST /domain/delete
 * delete domain
 */
exports.deleteDomain = async (req, res) => {

	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0
		|| !res.locals.user.domains.includes(req.body.domain)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const domain = req.body.domain.toLowerCase();

	//TODO: make loop through each cluster? or make domains per-cluster, hmmm
	const [existingHost, existingMaintenance, existingRewrite, existingDdos] = await Promise.all([
		res.locals.dataPlane.showRuntimeMap({ map: process.env.HOSTS_MAP_NAME })
			.then(res => res.data).then(map => map.some(e => e.key === domain)),
		res.locals.dataPlane.showRuntimeMap({ map: process.env.MAINTENANCE_MAP_NAME })
			.then(res => res.data).then(map => map.some(e => e.key === domain)),
		res.locals.dataPlane.showRuntimeMap({ map: process.env.REWRITE_MAP_NAME })
			.then(res => res.data).then(map => map.some(e => e.key === domain)),
		res.locals.dataPlane.showRuntimeMap({ map: process.env.DDOS_MAP_NAME })
			.then(res => res.data).then(map => map.some(e => {
				const { hostname, pathname } = url.parse(`https://${e.key}`);
				return hostname === domain;
			}))
	]);

	if (existingHost || existingMaintenance || existingRewrite || existingDdos) {
		return dynamicResponse(req, res, 400, { error: "Cannot remove domain lwhile still in use. Remove it from backends/maintenance/rewrites/protection first." });
	}


	await db.db.collection('accounts')
		.updateOne({_id: res.locals.user.username}, {$pull: {domains: domain }});

	return dynamicResponse(req, res, 302, { redirect: '/domains' });

};

