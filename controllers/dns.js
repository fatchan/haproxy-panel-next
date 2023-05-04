const db = require('../db.js');
const redis = require('../redis.js');
const url = require('url');
const { dynamicResponse } = require('../util.js');

/**
* GET /dns/:domain
* domains page
*/
exports.dnsDomainPage = async (app, req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return res.redirect('/domains');
	}
	const recordSetsRaw = await redis.hgetall(`${req.params.domain}.`);
	const recordSets = recordSetsRaw && Object.keys(recordSetsRaw)
		.map(k => {
			return { [k]: JSON.parse(recordSetsRaw[k]) };
		}) || [];
	return app.render(req, res, `/dns/${req.params.domain}`, {
		csrf: req.csrfToken(),
		recordSets,
	});
};

/**
* GET /dns/:domain/:zone/:type
* domains page
*/
exports.dnsRecordPage = async (app, req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return res.redirect('/domains');
	}
	const recordSet = await redis.hget(`${req.params.domain}.`, req.params.zone);
	return app.render(req, res, `/dns/${req.params.domain}/${req.params.zone}/${req.params.type}`, {
		csrf: req.csrfToken(),
		recordSets: [{ [req.params.zone]: recordSet||{} }],
	});
};

/**
* GET /dns/:domain.json
* domains json data
*/
exports.dnsDomainJson = async (req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 403, { error: 'No permission for this domain' });
	}
	const recordSetsRaw = await redis.hgetall(`${req.params.domain}.`);
	const recordSets = recordSetsRaw && Object.keys(recordSetsRaw)
		.map(k => {
			return { [k]: JSON.parse(recordSetsRaw[k]) };
		}) || [];
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		recordSets,
	});
};

/**
* GET /dns/:domain/:zone.json
* domains json data
*/
exports.dnsRecordJson = async (req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 403, { error: 'No permission for this domain' });
	}
	const recordSet = await redis.hget(`${req.params.domain}.`, req.params.zone);
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		recordSets: [{ [req.params.zone]: recordSet||{} }],
	});
};

