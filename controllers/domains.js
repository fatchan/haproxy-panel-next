import * as db from '../db.js';
import url from 'node:url';
import { dynamicResponse } from '../util.js';
import * as redis from '../redis.js';
import psl from 'psl';
import { getNsTemplate, getSoaTemplate } from '../templates.js';

/**
 * GET /domains
 * domains page
 */
export async function domainsPage(app, req, res) {
	const certs = await db.db().collection('certs')
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
	certs.forEach(c => c.date = c.date.toISOString());
	res.locals.data = {
		user: res.locals.user,
		csrf: req.csrfToken(),
		certs: certs || [],
	};
	return app.render(req, res, '/domains');
};

/**
 * GET /domains.json
 * domains json data
 */
export async function domainsJson(req, res) {
	const certs = await db.db().collection('certs')
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
	certs.forEach(c => c.date = c.date.toISOString());
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		certs: certs || [],
	});
};

/**
 * POST /domain/add
 * add domain
 */
export async function addDomain(req, res, next) {

	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	if (res.locals.user.username !== 'admin'
		&& (res.locals.user.domains && res.locals.user.domains.length >= (res.locals.user.maxDomains || 5))) {
		return dynamicResponse(req, res, 403, { error: 'Domain limit reached' });
	}

	let domain = req.body.domain.toLowerCase();

	if (res.locals.user.domains.includes(domain)) {
		return dynamicResponse(req, res, 403, { error: 'Domain already added' });
	}

	try {
		const { hostname } = url.parse(`https://${domain}`);
		domain = hostname;
	} catch (e) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	try {
		const parsed = psl.parse(domain);
		if (!parsed || !parsed.domain) {
			return dynamicResponse(req, res, 400, { error: 'Invalid input' });
		}
		if (parsed.domain !== domain && !res.locals.user.domains.includes(parsed.domain)) {
			return dynamicResponse(req, res, 403, { error: 'Add the root domain before adding subdomains' });
		}
		const domains = [domain, parsed.domain];
		const existing = await db.db().collection('accounts')
			.findOne({
				'$or': [
					{ domains: domain },
					{ domains: new RegExp(`${parsed.domain}$`), _id: { '$ne': res.locals.user.username } },
				]
			});
		if (existing) {
			return dynamicResponse(req, res, 400, { error: 'This domain is already in use or belongs to another user' });
		}
		await db.db().collection('accounts')
			.updateOne({
				_id: res.locals.user.username
			}, {
				$addToSet: {
					domains: {
						'$each': domains,
					}
				}
			});
		await res.locals
			.dataPlaneAll('addPayloadRuntimeMap', {
				name: process.env.NEXT_PUBLIC_DOMTOACC_MAP_NAME,
			}, [{
				key: domain,
				value: res.locals.user.username,
			}], null, false, false);
		if (domain.split('.').length < 3 //naive
			&& getSoaTemplate && getNsTemplate) {
			const soaRecords = JSON.parse(JSON.stringify(getSoaTemplate()));
			soaRecords[0].MBox = `root.${domain}.`;
			soaRecords[0].l = true;
			soaRecords[0].t = true;
			const nsRecords = JSON.parse(JSON.stringify(getNsTemplate()));
			nsRecords.forEach(r => {
				r.l = true;
				r.t = true;
			});
			let recordSetRaw = await redis.hget(`dns:${domain}.`, '@');
			if (!recordSetRaw) {
				recordSetRaw = {};
			}
			recordSetRaw['soa'] = soaRecords[0];
			recordSetRaw['ns'] = nsRecords;
			await redis.hset(`dns:${domain}.`, '@', recordSetRaw);
		}
	} catch (e) {
		return next(e);
	}

	return dynamicResponse(req, res, 302, { redirect: req.body.onboarding ? '/onboarding' : '/domains' });

};

/**
 * POST /domain/delete
 * delete domain
 */
export async function deleteDomain(req, res) {

	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0
		|| !res.locals.user.domains.includes(req.body.domain)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const domain = req.body.domain.toLowerCase();

	//TODO: make loop through each cluster? or make domains per-cluster, hmmm
	const [existingHost, existingMaintenance, existingRewrite, existingDdos] = await Promise.all([
		res.locals.dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_HOSTS_MAP_NAME })
			.then(res => res.data).then(map => map.some(e => e.key === domain)),
		res.locals.dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME })
			.then(res => res.data).then(map => map.some(e => e.key === domain)),
		res.locals.dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_REWRITE_MAP_NAME })
			.then(res => res.data).then(map => map.some(e => e.key === domain)),
		res.locals.dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_DDOS_MAP_NAME })
			.then(res => res.data).then(map => map.some(e => {
				const { hostname } = url.parse(`https://${e.key}`);
				return hostname === domain;
			}))
	]);

	if (existingHost || existingMaintenance || existingRewrite || existingDdos) {
		return dynamicResponse(req, res, 400, { error: 'Cannot remove domain while still in use. Remove it from backends/maintenance/rewrites/protection first.' });
	}

	await db.db().collection('accounts')
		.updateOne({_id: res.locals.user.username}, {$pull: {domains: domain }});
	await res.locals
		.dataPlaneAll('deleteRuntimeMapEntry', {
			map: process.env.NEXT_PUBLIC_DOMTOACC_MAP_NAME,
			id: domain,
		}, null, null, false, false);
	await redis.del(`dns:${domain}.`);

	return dynamicResponse(req, res, 302, { redirect: '/domains' });

};

