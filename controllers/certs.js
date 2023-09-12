const db = require('../db.js');
const acme = require('../acme.js');
const url = require('url');
const { dynamicResponse, wildcardCheck, filterCertsByDomain } = require('../util.js');
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
	const clusterCerts = await res.locals
		.dataPlaneRetry('getAllStorageSSLCertificates')
		.then(certs => filterCertsByDomain(certs.data, res.locals.user.domains));
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
	const clusterCerts = await res.locals
		.dataPlaneRetry('getAllStorageSSLCertificates')
		.then(certs => filterCertsByDomain(certs.data, res.locals.user.domains));
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
	let wildcardOk = true;
	if (req.body.subject.startsWith('*.')) {
		wildcardOk = wildcardCheck(req.body.subject, res.locals.user.domains);
	}
	if (!req.body.subject || typeof req.body.subject !== 'string' || req.body.subject.length === 0
		|| (!res.locals.user.domains.includes(req.body.subject) && !wildcardOk)) {
		return dynamicResponse(req, res, 400, { error: 'Add a matching domain in the domains page before generating a certficate' });
	}

	if (!req.body.altnames || typeof req.body.altnames !== 'object'
		|| (req.body.altnames.some(d => !res.locals.user.domains.includes(d)) && !wildcardOk)) {
		return dynamicResponse(req, res, 400, { error: 'Add all the altnames on the domains page before generating a certificate' });
	}

	if (req.body.email && (typeof req.body.email !== 'string'
		|| !/^\S+@\S+\.\S+$/.test(req.body.email))) {
		return dynamicResponse(req, res, 400, { error: 'Invalid email' });
	}

	const subject = req.body.subject.toLowerCase();
	const altnames = req.body.altnames.map(a => a.toLowerCase());
	const email = req.body.email;

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
		const { csr, key, cert, haproxyCert, date } = await acme.generate(subject, altnames, email, ['dns-01', 'http-01']);
		const { message, description, file, storage_name: storageName } = await res.locals.postFileAll(
			'/v2/services/haproxy/storage/ssl_certificates',
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
			email: email,
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
		console.error(e);
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
		console.log('Upload cert:', existingCert.subject);
		const { message } = await res.locals.postFileAll(
			'/v2/services/haproxy/storage/ssl_certificates',
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

	const clusterCerts = await res.locals
		.dataPlaneRetry('getAllStorageSSLCertificates')
		.then(certs => filterCertsByDomain(certs.data, res.locals.user.domains));

	//Delete cert from cluster if storage_name sent
	if (req.body.storage_name && typeof req.body.storage_name === 'string') {
		const storageName = req.body.storage_name;
		const clusterCerts = await res.locals
			.dataPlaneRetry('getAllStorageSSLCertificates')
			.then(certs => filterCertsByDomain(certs.data, res.locals.user.domains));
		if (!clusterCerts.find(c => c.storage_name === req.body.storage_name)) {
			return dynamicResponse(req, res, 400, { error: 'Invalid input' });
		}
		await res.locals
			.dataPlaneAll('deleteStorageSSLCertificate', {
				name: storageName,
				skip_reload: true,
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
		await db.db.collection('accounts')
			.updateOne({
				_id: res.locals.user.username
			}, {
				'$set': {
					onboarding: true, //skip during onboarding
				}
			});
		const serialNumber = serial && serial.value && serial.value.number || 1;
		console.log('Attempting to sign CSR, serial', serialNumber)
		const signedCert = verifyCSR(req.body.csr, res.locals.user.domains, serialNumber);
		if (req.headers['accept'].toLowerCase() === 'application/json') {
			return res.send(signedCert);
		}
		return dynamicResponse(req, res, 200, `<pre>${signedCert}</pre>`);
	} catch (e) {
		return next(e);
	}
};
