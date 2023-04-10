const db = require('../db.js');
const acme = require('../acme.js');
const url = require('url');
const { dynamicResponse } = require('../util.js');
const { verifyCSR } = require('../ca.js');

/**
 * GET /certs
 * certs page
 */
exports.certsPage = async (app, req, res) => {
	const dbCerts = await db.db.collection('certs')
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
		.toArray()
	dbCerts.forEach(c => c.date = c.date.toISOString());
	const clusterCerts = await res.locals.dataPlane
		.getAllStorageSSLCertificates()
		.then(certs => {
			return certs.data.filter(c => {
				const approxSubject = c.storage_name
					.replaceAll('_', '.')
					.substr(0, c.storage_name.length-4);
				return res.locals.user.domains.includes(approxSubject);
			});
		});
	return app.render(req, res, '/certs', {
		csrf: req.csrfToken(),
		dbCerts,
		clusterCerts,
	});
};

/**
 * GET /certs.json
 * certs json data
 */
exports.certsJson = async (req, res) => {
	const dbCerts = await db.db.collection('certs')
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
		.toArray()
	dbCerts.forEach(c => c.date = c.date.toISOString());
	const clusterCerts = await res.locals.dataPlane
		.getAllStorageSSLCertificates()
		.then(certs => {
			return certs.data.filter(c => {
				const approxSubject = c.storage_name
					.replaceAll('_', '.')
					.substr(0, c.storage_name.length-4);
				return res.locals.user.domains.includes(approxSubject);
			});
		});
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		dbCerts,
		clusterCerts,
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

	const subject = req.body.subject.toLowerCase();
	const altnames = req.body.altnames.map(a => a.toLowerCase());

	const backendMap = await res.locals
		.dataPlane.showRuntimeMap({
			map: process.env.HOSTS_MAP_NAME
		})
		.then(res => res.data);
	const backendDomainEntry = backendMap && backendMap.find(e => e.key === req.body.subject);
	if (!backendDomainEntry) {
		return dynamicResponse(req, res, 400, { error: 'Add a backend for the domain first before generating a certificate' });
	}

	const maintenanceMap = await res.locals
		.dataPlane.showRuntimeMap({
			map: process.env.MAINTENANCE_MAP_NAME
		})
		.then(res => res.data);
	const maintenanceDomainEntry = maintenanceMap && maintenanceMap.find(e => e.key === req.body.subject);
	if (maintenanceDomainEntry) {
		return dynamicResponse(req, res, 400, { error: 'Cannot generate a certificate while the domain is in maintenance mode' });
	}

	const existingCert = await db.db.collection('certs').findOne({ _id: subject });
	if (existingCert) {
		return dynamicResponse(req, res, 400, { error: 'Cert with this subject already exists' });
	}

	try {
		url.parse(`https://${subject}`);
		altnames.forEach(d => {
			url.parse(`https://${d}`);
		});
	} catch (e) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	try {
		console.log('Add cert request:', subject, altnames);
		const { csr, key, cert, haproxyCert, date } = await acme.generate(subject, altnames);
		const { message, description, file, storage_name: storageName } = await res.locals.postFileAll(
			'/v2/services/haproxy/storage/ssl_certificates?force_reload=true',
			{
				method: 'POST',
				headers: { 'authorization': res.locals.dataPlane.defaults.headers.authorization },
			},
			haproxyCert,
			{
				filename: `${subject}.pem`,
				contentType: 'text/plain',
			}
		);
		if (message) {
			return dynamicResponse(req, res, 400, { error: message });
		}
		let update = {
			_id: subject,
			subject: subject,
			altnames: altnames,
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
				_id: subject,
			}, {
				$set: update,
			}, {
				upsert: true,
			});
	} catch (e) {
		return next(e);
	}

	return dynamicResponse(req, res, 302, { redirect: req.body.onboarding ? '/onboarding' : '/certs' });

};

/**
 * POST /cert/upload
 * push existing db cert to cluster
 */
exports.uploadCert = async (req, res, next) => {

	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0
		|| !res.locals.user.domains.includes(req.body.domain)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const domain = req.body.domain.toLowerCase();

	const existingCert = await db.db.collection('certs').findOne({ _id: domain, username: res.locals.user.username });
	if (!existingCert || !existingCert.haproxyCert) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	try {
		console.log('Upload cert:', existingCert.subject, existingCert.altnames);
		const { message } = await res.locals.postFileAll(
			'/v2/services/haproxy/storage/ssl_certificates?force_reload=true',
				{
				method: 'POST',
				headers: { 'authorization': res.locals.dataPlane.defaults.headers.authorization },
			},
			existingCert.haproxyCert,
			{
				filename: `${existingCert.subject}.pem`,
				contentType: 'text/plain',
			}
		);
		if (message) {
			return dynamicResponse(req, res, 400, { error: message });
		}
	} catch (e) {
		return next(e);
	}

	return dynamicResponse(req, res, 302, { redirect: '/certs' });

};

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



	const subject = req.body.subject.toLowerCase();

	//Delete cert from cluster if storage_name sent
	if (req.body.storage_name && typeof req.body.storage_name === 'string') {
		const storageName = req.body.storage_name;
		const certExists = await db.db.collection('certs')
			.findOne({ storageName, username: res.locals.user.username });
		if (!certExists) {
			return dynamicResponse(req, res, 400, { error: 'Invalid input' });
		}
		await res.locals
			.dataPlaneAll('deleteStorageSSLCertificate', {
				name: storageName,
			});
		return dynamicResponse(req, res, 302, { redirect: '/certs' });
	}

	//otherwise completely delete from db
	await db.db.collection('certs')
		.deleteOne({ _id: subject, username: res.locals.user.username });

	return dynamicResponse(req, res, 302, { redirect: '/certs' });

};

/**
 * POST /csr/verify
 * Delete the map entries of the body 'domain'
 */
exports.verifyUserCSR = async (req, res, next) => {
	if(!req.body || !req.body.csr || typeof req.body.csr !== 'string' || req.body.csr.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid csr' });
	}
	try {
		const serial = await db.db.collection('certs')
			.findOneAndUpdate({
				_id: 'serial',
			}, {
				$inc: {
					number: 1,
				},
			}, {
				upsert: true,
			});
		const serialNumber = serial && serial.value && serial.value.number || 1;
		console.log('Attempting to sign CSR, serial', serialNumber)
		const signedCert = verifyCSR(req.body.csr, res.locals.user.domains, serialNumber);
		return dynamicResponse(req, res, 200, `<pre>${signedCert}</pre>`);
	} catch (e) {
		return next(e);
	}
};
