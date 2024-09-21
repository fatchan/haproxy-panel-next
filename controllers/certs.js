import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
import * as db from '../db.js';
import * as acme from '../acme.js';
import url from 'node:url';
import { dynamicResponse, wildcardAllowed, filterCertsByDomain } from '../util.js';
import { verifyCSR } from '../ca.js';
import { Resolver } from 'node:dns/promises';
import { trimmedNsHosts } from '../templates.js';
import psl from 'psl';

const resolver = new Resolver();
resolver.setServers(process.env.NAMESERVERS.split(','));

/**
 * GET /certs
 * certs page
 */
export async function certsPage(app, req, res) {
	const dbCerts = await db.db().collection('certs')
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
	dbCerts.forEach(c => c.date = c.date.toISOString());
	const clusterCerts = await res.locals
		.dataPlaneRetry('getAllStorageSSLCertificates')
		.then(certs => filterCertsByDomain(certs.data, res.locals.user.domains));
	res.locals.data = {
		csrf: req.csrfToken(),
		user: res.locals.user,
		dbCerts: dbCerts || [],
		clusterCerts: clusterCerts || [],
	};
	return app.render(req, res, '/certs');
};

/**
 * GET /certs.json
 * certs json data
 */
export async function certsJson(req, res) {
	const dbCerts = await db.db().collection('certs')
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
	dbCerts.forEach(c => c.date = c.date.toISOString());
	const clusterCerts = await res.locals
		.dataPlaneRetry('getAllStorageSSLCertificates')
		.then(certs => filterCertsByDomain(certs.data, res.locals.user.domains));
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
		dbCerts: dbCerts || [],
		clusterCerts: clusterCerts || [],
	});
};

/**
 * POST /cert/add
 * add cert
 */
export async function addCert(req, res, next) {
	if (!req.body.subject || typeof req.body.subject !== 'string' || req.body.subject.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Missing subject' });
	}
	req.body.subject = req.body.subject.trim();
	if (!req.body.altnames || typeof req.body.altnames !== 'object') {
		return dynamicResponse(req, res, 400, { error: 'Missing altname(s)' });
	}
	req.body.altnames = req.body.altnames.map(x => x.trim());

	const rootDomain = psl.parse(req.body.subject.replace('*', 'x')).domain;
	let certDomainNameservers = [];
	try {
		certDomainNameservers = await resolver.resolve(rootDomain, 'NS');
	} catch(e) {
		console.warn(e); //probably just no NS records, bad domain
		certDomainNameservers = null;
	}
	if (!certDomainNameservers
		|| !trimmedNsHosts.some(nsHost => certDomainNameservers.includes(nsHost))) {
		return dynamicResponse(req, res, 400, { error: 'Domain nameservers incorrect, please visit onboarding' });
	}

	if (!(res.locals.user.domains.includes(req.body.subject)
		|| (req.body.subject.startsWith('*.') && wildcardAllowed(req.body.subject, res.locals.user.domains)))) {
		return dynamicResponse(req, res, 400, { error: `You don't have permission to generate a certificate with subject ${req.body.subject}` });
	}
	if (!req.body.altnames.every(altName => {
		return res.locals.user.domains.includes(altName)
			|| (altName.startsWith('*.') && wildcardAllowed(req.body.subject, res.locals.user.domains));
	})) {
		return dynamicResponse(req, res, 400, { error: `You don't have permission to generate a certificate with altname(s) ${req.body.altnames}` });
	}

	if (req.body.email && (typeof req.body.email !== 'string'
		|| !/^\S+@\S+\.\S+$/.test(req.body.email))) {
		return dynamicResponse(req, res, 400, { error: 'Invalid email' });
	}

	const subject = req.body.subject.toLowerCase();
	const altnames = req.body.altnames.map(a => a.toLowerCase());
	const email = req.body.email;

	const existingCert = await db.db().collection('certs').findOne({ _id: subject });
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
			'/v3/services/haproxy/storage/ssl_certificates',
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
		};
		if (description) {
			//may be null due to "already exists", so we keep existing props
			update = { ...update, description, file, storageName };
		}
		await db.db().collection('certs')
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
export async function uploadCert(req, res, next) {

	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0
		|| !res.locals.user.domains.includes(req.body.domain)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const domain = req.body.domain.toLowerCase();

	const existingCert = await db.db().collection('certs').findOne({ _id: domain, username: res.locals.user.username });
	if (!existingCert || !existingCert.haproxyCert) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	try {
		console.log('Upload cert:', existingCert.subject);
		const { message } = await res.locals.postFileAll(
			'/v3/services/haproxy/storage/ssl_certificates',
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
export async function deleteCert(req, res) {

	if (!req.body.subject || typeof req.body.subject !== 'string' || req.body.subject.length === 0
		//|| !res.locals.user.domains.includes(req.body.subject)
	) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const subject = req.body.subject.toLowerCase();

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
			}, null, null, false, true);
		return dynamicResponse(req, res, 302, { redirect: '/certs' });
	}

	//otherwise completely delete from db
	await db.db().collection('certs')
		.deleteOne({ _id: subject, username: res.locals.user.username });

	return dynamicResponse(req, res, 302, { redirect: '/certs' });

};

/**
 * POST /csr/verify
 * Delete the map entries of the body 'domain'
 */
export async function verifyUserCSR(req, res, next) {
	if(!req.body || !req.body.csr || typeof req.body.csr !== 'string' || req.body.csr.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid CSR' });
	}
	try {
		const serial = await db.db().collection('certs')
			.findOneAndUpdate({
				_id: 'serial',
			}, {
				$inc: {
					number: 1,
				},
			}, {
				upsert: true,
			});
		await db.db().collection('accounts')
			.updateOne({
				_id: res.locals.user.username
			}, {
				'$set': {
					onboarding: true, //skip during onboarding
				}
			});
		const serialNumber = serial && serial.value && serial.value.number || 1;
		console.log('Attempting to sign CSR, serial', serialNumber);
		const signedCert = verifyCSR(req.body.csr, res.locals.user.domains, serialNumber);
		if (req.body.json) {
			return res.json({
				csrf: req.csrfToken(),
				user: res.locals.user,
				csr: signedCert,
			});
		} if (req.headers['accept'].toLowerCase() === 'application/json') {
			return res.send(signedCert); //for ansible
		}
		return dynamicResponse(req, res, 200, `<pre>${signedCert}</pre>`);
	} catch (e) {
		console.error(e);
		if (e.message) {
			return dynamicResponse(req, res, 400, { error: e.message });
		}
		return next(e);
	}
};
