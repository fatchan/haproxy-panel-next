const db = require('../db.js');
const acme = require('../acme.js');
const url = require('url');
const { dynamicResponse } = require('../util.js');

/**
 * GET /certs
 * certs page
 */
exports.certsPage = async (app, req, res) => {
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
	return app.render(req, res, '/certs', {
		csrf: req.csrfToken(),
		certs,
	});
};

/**
 * GET /certs.json
 * certs json data
 */
exports.certsJson = async (req, res) => {
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
 * POST /cert/add
 * add cert
 */
exports.addCert = async (req, res, next) => {

	if (!req.body.subject || typeof req.body.subject !== 'string' || req.body.subject.length === 0
		|| !res.locals.user.domains.includes(req.body.subject)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid subject' });
	}

	if (!req.body.altnames || typeof req.body.altnames !== 'object'
		|| req.body.altnames.some(d => !res.locals.user.domains.includes(d))) {
		return dynamicResponse(req, res, 400, { error: 'Invalid altname(s)' });
	}

	const existingCert = await db.db.collection('certs').findOne({ _id: req.body.subject });
	if (existingCert) {
		return dynamicResponse(req, res, 400, { error: 'Cert with this subject already exists' });
	}

	try {
		url.parse(`https://${req.body.subject}`);
		req.body.altnames.forEach(d => {
			url.parse(`https://${d}`);
		});
	} catch (e) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	try {
		console.log('Add cert request', req.body.subject, req.body.altnames);
		const { csr, key, cert, haproxyCert, date } = await acme.generate(req.body.subject, req.body.altnames);
		const fd = new FormData();
		fd.append('file_upload', new Blob([haproxyCert], { type: 'text/plain' }), `${req.body.subject}.pem`);
		const { description, file, storage_name: storageName } = await res.locals.fetchAll('/v2/services/haproxy/storage/ssl_certificates?force_reload=true', {
				method: 'POST',
				headers: { 'authorization': res.locals.dataPlane.defaults.headers.authorization },
				body: fd,
			});
		let update = {
			_id: req.body.subject,
			subject: req.body.subject,
			altnames: req.body.altnames,
			username: res.locals.user.username,
			csr, key, cert, haproxyCert, // cert creation data
			date,
		}
		if (description) {
			//may be null due to "already exists", so we keep existing props
			update = { ...update, description, file, storageName };
        }
		await db.db.collection('certs')
			.updateOne({
				_id: req.body.subject,
			}, {
				$set: update,
			}, {
				upsert: true,
			});
	} catch (e) {
		return next(e);
	}

	return dynamicResponse(req, res, 302, { redirect: '/certs' });
};

//TODO: new route to sync ssl certs throughout cluster

/**
 * POST /cert/delete
 * delete cers
 */
exports.deleteCert = async (req, res) => {

	if (!req.body.subject || typeof req.body.subject !== 'string' || req.body.subject.length === 0
		//|| !res.locals.user.domains.includes(req.body.subject)
		) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	await db.db.collection('certs')
		.deleteOne({ _id: req.body.subject, username: res.locals.user.username });

	return dynamicResponse(req, res, 302, { redirect: '/certs' });

};
