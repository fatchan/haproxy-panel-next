const db = require('../db.js');
const redis = require('../redis.js');
const url = require('url');
const { isIPv4, isIPv6 } = require('net');
const { dynamicResponse } = require('../util.js');
const { aTemplate, aaaaTemplate } = require('../templates.js');

/**
* GET /dns/:domain
* domains records page
*/
exports.dnsDomainPage = async (app, req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 302, { redirect: '/domains' });
	}
	const recordSetsRaw = await redis.hgetall(`dns:${req.params.domain}.`);
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
* record set page
*/
exports.dnsRecordPage = async (app, req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 302, { redirect: '/domains' });
	}
	let recordSet = [];
	if (req.params.zone && req.params.type) {
		let recordSetRaw = await redis.hget(`dns:${req.params.domain}.`, req.params.zone);
		if (!recordSetRaw) {
			recordSetRaw = {};
		}
		recordSet = recordSetRaw[req.params.type];
		recordSet = Array.isArray(recordSet) ? recordSet : (recordSet ? [recordSet] : []);
	}
	return app.render(req, res, `/dns/${req.params.domain}/${req.params.zone||"name"}/${req.params.type||"a"}`, {
		csrf: req.csrfToken(),
		recordSet,
	});
};

/**
* GET /dns/:domain.json
* domain record json
*/
exports.dnsDomainJson = async (req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 403, { error: 'No permission for this domain' });
	}
	const recordSetsRaw = await redis.hgetall(`dns:${req.params.domain}.`);
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
* record set json
*/
exports.dnsRecordJson = async (req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 403, { error: 'No permission for this domain' });
	}
	let recordSet = [];
	if (req.params.zone && req.params.type) {
		let recordSetRaw = await redis.hget(`dns:${req.params.domain}.`, req.params.zone);
		if (!recordSetRaw) {
			recordSetRaw = {};
		}
		recordSet = recordSetRaw[req.params.type];
		recordSet = Array.isArray(recordSet) ? recordSet : (recordSet ? [recordSet] : []);
	}
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		recordSet,
	});
};


/**
* POST /post/:domain/:zone/:type/delete
* delete record
*/
exports.dnsRecordDelete = async (req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 302, { redirect: '/domains' });
	}
	if (req.params.zone && req.params.type) {
		let recordSetRaw = await redis.hget(`dns:${req.params.domain}.`, req.params.zone);
		if (!recordSetRaw) {
			recordSetRaw = {};
		}
		delete recordSetRaw[req.params.type];
		if (Object.keys(recordSetRaw).length === 0) {
			await redis.hdel(`dns:${req.params.domain}.`, req.params.zone);
		} else {
			await redis.hset(`dns:${req.params.domain}.`, req.params.zone, recordSetRaw);
		}
	}
	return dynamicResponse(req, res, 302, { redirect: `/dns/${req.params.domain}` });
};

/**
* POST /post/:domain/:zone/:type
* add/update record
*/
exports.dnsRecordUpdate = async (req, res) => {
	if (!res.locals.user.domains.includes(req.params.domain)) {
		return dynamicResponse(req, res, 403, { error: 'No permission for this domain' });
	}
	/*if (Object.values(req.body).some(v => typeof v !== "string")) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}*/
	let { ttl } = req.body;
	let { domain, zone, type } = req.params;
	let records = [];
	if (type === 'a_template') {
		records = aTemplate;
		type = 'a';
	} else if (type === 'aaaa_template') {
		records = aaaaTemplate;
		type = 'aaaa';
	} else {
		for (let i = 0; i < (type == "soa" ? 1 : 100); i++) {
			let {
				[`value_${i}`]: value,
				//geo
				[`geok_${i}`]: geok,
				[`geov_${i}`]: geov,
				[`preference_${i}`]: preference,
				[`port_${i}`]: port,
				//health
				[`id_${i}`]: id,
				[`health_${i}`]: h,
				[`fallbacks_${i}`]: fb,
				[`sel_${i}`]: sel,
				[`bsel_${i}`]: bsel,
				//other (numbers)
				[`weight_${i}`]: weight,
				[`priority_${i}`]: priority,
				[`flag_${i}`]: flag,
				[`refresh_${i}`]: refresh,
				[`retry_${i}`]: retry,
				[`expire_${i}`]: expire,
				//other
				[`tag_${i}`]: tag,
				[`mbox_${i}`]: MBox,
			} = req.body;
			if (!value) { break; }
			try {
				if ((geok && !["cn", "cc"].includes(geok))
					|| (sel && !["0", "1", "2", "3"].includes(sel))
					|| (bsel && !["0", "1", "2", "3"].includes(bsel))
					|| (flag && (isNaN(flag) || parseInt(flag) !== +flag))
					|| (ttl && (isNaN(ttl) || parseInt(ttl) !== +ttl))
					|| (preference && (isNaN(preference) || parseInt(preference) !== +preference))
					|| (port && (isNaN(port) || parseInt(port) !== +port))
					|| (weight && (isNaN(weight) || parseInt(weight) !== +weight))
					|| (priority && (isNaN(priority) || parseInt(priority) !== +priority))
					|| (refresh && (isNaN(refresh) || parseInt(refresh) !== +refresh))
					|| (retry && (isNaN(retry) || parseInt(retry) !== +retry))
					|| (expire && (isNaN(expire) || parseInt(expire) !== +expire))
					|| (geov && !Array.isArray(geov))
					|| (fb && !Array.isArray(fb))) {
					return dynamicResponse(req, res, 400, { error: 'Invalid input' });
				}
				flag && (flag = parseInt(flag));
				ttl && (ttl = parseInt(ttl));
				preference && (preference = parseInt(preference));
				port && (port = parseInt(port));
				weight && (weight = parseInt(weight));
				priority && (priority = parseInt(priority));
				refresh && (refresh = parseInt(refresh));
				retry && (retry = parseInt(retry));
				expire && (expire = parseInt(expire));
				sel && (sel = parseInt(sel));
				bsel && (bsel = parseInt(bsel));
				h && (h = (h != null ? true : false));
				geov && (geov = geov.map(x => x.trim()).slice(0,300)); //todo: country/continent filter
				fb && (fb = fb.map(x => x.trim()).slice(0,20));
			} catch(e) {
				console.error(e);
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
			let record;
			switch(type) {
				case "a":
					if (!isIPv4(value)) {
						return dynamicResponse(req, res, 400, { error: 'Invalid input' });
					}
					record = { ttl, id, ip: value, geok, geov, h, sel, bsel, fb, u: true };
					break;
				case "aaaa":
					if (!isIPv6(value)) {
						return dynamicResponse(req, res, 400, { error: 'Invalid input' });
					}
					record = { ttl, id, ip: value, geok, geov, h, sel, bsel, fb, u: true };
					break;
				case "txt":
					record = { ttl, text: value };
					break;
				case "cname":
				case "ns":
					record = { ttl, host: value };
					break;
				case "mx":
					record = { ttl, host: value, preference };
					break;
				case "srv":
					record = { ttl, target: value, port, weight, priority };
					break;
				case "caa":
					record = { ttl, value, flag, tag };
					break;
				case "soa":
					record = { ttl, ns: value, MBox, refresh, retry, expire, minttl: 30 };
					break;
				default:
					return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
			records.push(record);
		}
	}
	if (records.lencth === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}
	let recordSetRaw = await redis.hget(`dns:${req.params.domain}.`, req.params.zone);
	if (!recordSetRaw) {
		recordSetRaw = {};
	}
	if (type == "soa") {
		recordSetRaw[type] = records[0];
	} else {
		recordSetRaw[type] = records;
	}
	await redis.hset(`dns:${domain}.`, zone, recordSetRaw);
	return dynamicResponse(req, res, 302, { redirect: `/dns/${domain}` });
};
