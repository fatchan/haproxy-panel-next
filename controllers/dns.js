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
	let recordSet = [{}];
	if (req.params.zone && req.params.type) {
		const recordSetRaw = await redis.hget(`${req.params.domain}.`, req.params.zone);
		recordSet = recordSetRaw[req.params.type];
		recordSet = Array.isArray(recordSet) ? recordSet : [recordSet];
	}
	return app.render(req, res, `/dns/${req.params.domain}/${req.params.zone||"name"}/${req.params.type||"a"}`, {
		csrf: req.csrfToken(),
		recordSet,
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
* GET /dns/:domain/:zone/:type.json
* domains json data
*/
exports.dnsRecordJson = async (req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 403, { error: 'No permission for this domain' });
	}
	let recordSet = [{}];
	if (req.params.zone && req.params.type) {
		const recordSetRaw = await redis.hget(`${req.params.domain}.`, req.params.zone);
		recordSet = recordSetRaw[req.params.type];
		recordSet = Array.isArray(recordSet) ? recordSet : [recordSet];
	}
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		recordSet,
	});
};


/**
* POST /post/:domain/:zone/:type
* domains json data
*/
exports.dnsRecordUpdate = async (req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 403, { error: 'No permission for this domain' });
	}
	const { ttl, selection } = req.body;
	const { domain, zone, type } = req.params;
	const records = [];
	for (let i = 0; i < 100; i++) {
		const {
			[`id_${i}`]: id,
			[`value_${i}`]: value,
			[`health_${i}`]: h,
			[`geok_${i}`]: geok,
			[`geov_${i}`]: geov,
			[`sel_${i}`]: sel,
			[`bsel_${i}`]: bsel,
			[`pref_${i}`]: preference,
		} = req.body;
		if (!value) { break; }
		let record;
		switch(type) {
			case "a":
			case "aaaa":
				record = { ttl, id, ip: value, geok, geov, h, geok, geov, sel, bsel };
				break;
			case "txt":
				record = { ttl, text: value };
				break;
			case "cname":
			case "ns":
				record = { ttl, host: value };
				break;
			case "mx":
				record = { ttl, host: value, preference }; //TODO: preference
				break;
			case "srv":
				record = { ttl, target: value, preference, port, weight, priority }; //TODO: preference, port, weight, prio
				break;
			case "caa":
				record = { ttl, value, flag, tag }; //TODO: flag, tag
				break;
			case "soa":
				record = { ttl, ns, MBox, refresh, retry, expire, minttl }; //TODO: MBox, refresh, retry, expire, minttl
				break;
			default:
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
		}
		//TODO: filter
		records.push(record);
	}
	console.log(JSON.stringify({ [type]: records }, null, 4))
	return dynamicResponse(req, res, 403, { error: 'Not implemented' });
};
