import bcrypt from 'bcrypt';
import * as db from '../db.js';
import { extractMap, dynamicResponse } from '../util.js';
import { Resolver } from 'node:dns/promises';
import ShkeeperManager from '../billing/shkeeper.js';
import QRCode from 'qrcode';
import  { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });

const localNSResolver = new Resolver();
localNSResolver.setServers(process.env.NAMESERVERS.split(','));
const cloudflareResolver = new Resolver();
cloudflareResolver.setServers(['1.1.1.1']);
const googleResolver = new Resolver();
googleResolver.setServers(['8.8.8.8']);
const quad9Resolver = new Resolver();
quad9Resolver.setServers(['9.9.9.9']);
const publicResolvers = [cloudflareResolver, googleResolver, quad9Resolver];

//TODO: move to lib
const nameserverTxtDomains = process.env.NAMESERVER_TXT_DOMAINS.split(',');
async function getNameserverTxtRecords() {
	for (const ntd of nameserverTxtDomains) {
		try {
			let txtRecords = await localNSResolver.resolve(ntd, 'TXT');
			if (txtRecords && txtRecords.length > 0) {
				return txtRecords;
			}
		} catch (error) {
			console.error(`Error querying TXT records for ${ntd}:`, error);
		}
	}
	return []; //todo: handle better on FE if none found at all
}

//TODO: move to lib
const expectedNameservers = new Set(process.env.NAMESERVERS_HOSTS.split(','));
async function checkPublicDNSRecord(domain, type, expectedSet) {
	const results = await Promise.all(publicResolvers.map(async pr => {
		const res = await pr.resolve(domain, type);
		return new Set(res||[]);
	}));
	return results.every(res => res.size === new Set([...res, ...expectedSet]).size);
}

/**
 * account page data shared between html/json routes
 */
export async function accountData(req, res, _next) {
	let maps = []
		, txtRecords = []
		, globalAcl = '0';
	if (res.locals.dataPlaneRetry) {
		maps = res.locals
			.dataPlaneRetry('getAllRuntimeMapFiles')
			.then(res => res.data)
			.then(data => data.map(extractMap))
			.then(maps => maps.filter(n => n))
			.then(maps => maps.sort((a, b) => a.fname.localeCompare(b.fname)));
		globalAcl = res.locals
			.dataPlaneRetry('getOneRuntimeMap', 'ddos_global')
			.then(res => res.data.description.split('').reverse()[0]);
		txtRecords = getNameserverTxtRecords();
		([maps, globalAcl, txtRecords] = await Promise.all([maps, globalAcl, txtRecords]));
	}
	return {
		csrf: req.csrfToken(),
		maps,
		globalAcl: globalAcl === '1',
		txtRecords,
	};
};

/**
 * extra information needed for the onboarding page to display known completed steps
 */
export async function onboardingData(req, res, _next) {
	const firstDomain = res.locals.user.domains && res.locals.user.domains.length > 0 ? res.locals.user.domains[0] : null;
	const [anyBackend, nameserversPropagated] = await Promise.all([
		db.db().collection('mapnotes').findOne({ username: res.locals.user.username, map: 'hosts' }),
		firstDomain	? checkPublicDNSRecord(firstDomain, 'NS', expectedNameservers) : void 0,
	]);
	return {
		hasBackend: anyBackend != null,
		nameserversPropagated,
	};
}

/**
 * GET /account
 * account page html
 */
export async function accountPage(app, req, res, next) {
	const data = await accountData(req, res, next);
	res.locals.data = { ...data, user: res.locals.user };
	return app.render(req, res, '/account');
}

/**
 * GET /onboarding
 * account page html
 */
export async function onboardingPage(app, req, res, next) {
	const [addData, onbData] = await Promise.all([
		accountData(req, res, next),
		onboardingData(req, res, next),
	]);
	res.locals.data = { ...addData, ...onbData, user: res.locals.user };
	return app.render(req, res, '/onboarding');
}

/**
 * GET /account.json
 * account page json data
 */
export async function accountJson(req, res, next) {
	const data = await accountData(req, res, next);
	return res.json({ ...data, user: res.locals.user });
}

/**
 * GET /onboarding.json
 * onboarding page json data
 */
export async function onboardingJson(req, res, next) {
	const [addData, onbData] = await Promise.all([
		accountData(req, res, next),
		onboardingData(req, res, next),
	]);
	return res.json({ ...addData, ...onbData, user: res.locals.user });
}

/**
 * POST /forms/global/toggle
 * toggle global ACL
 */
export async function globalToggle(req, res, next) {
	if (res.locals.user.username !== 'admin') {
		return dynamicResponse(req, res, 403, { error: 'Global ACL can only be toggled by an administrator' });
	}
	try {
		const globalAcl = await res.locals
			.dataPlaneRetry('getOneRuntimeMap', 'ddos_global')
			.then(res => res.data.description.split('').reverse()[0]);
		if (globalAcl === '1') {
			await res.locals
				.dataPlaneAll('deleteRuntimeMapEntry', {
					map: 'ddos_global',
					id: 'true'
				}, null, null, false, false);
		} else {
			await res.locals
				.dataPlaneAll('addPayloadRuntimeMap', {
					name: 'ddos_global'
				}, [{
					key: 'true',
					value: 'true'
				}], null, false, false);
		}
	} catch (e) {
		return next(e);
	}
	return dynamicResponse(req, res, 302, { redirect: '/account' });
}

/**
 * POST /forms/login
 * login
 */
export async function login(req, res) {
	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const account = await db.db().collection('accounts').findOne({ _id: username });
	if (!account) {
		return dynamicResponse(req, res, 403, { error: 'Incorrect username or password' });
	}
	if (account.inactive === true) {
		return dynamicResponse(req, res, 403, { error: 'Your account has been suspended for inactivity, please contact support.' });
	}
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);
	if (passwordMatch === true) {
		req.session.user = account._id;
		return dynamicResponse(req, res, 302, { redirect: '/account' });
	}
	return dynamicResponse(req, res, 403, { error: 'Incorrect username or password' });
}

/**
 * POST /forms/register
 * regiser
 */
export async function register(req, res) {

	if (!res.locals.user || res.locals.user.username !== 'admin') {
		return dynamicResponse(req, res, 400, { error: 'Registration is currently invite-only, please email contact@ceoofbased.com to inquire about openings.' });
	}

	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const rPassword = req.body.repeat_password;

	if (!username || typeof username !== 'string' || username.length === 0 || !/^[a-zA-Z0-9]+$/.test(username)
		|| !password || typeof password !== 'string' || password.length === 0
		|| !rPassword || typeof rPassword !== 'string' || rPassword.length === 0) {
		//todo: length limits, make jschan input validator LGPL lib and use here
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (password !== rPassword) {
		return dynamicResponse(req, res, 400, { error: 'Passwords did not match' });
	}

	const existingAccount = await db.db().collection('accounts').findOne({ _id: username });
	if (existingAccount) {
		return dynamicResponse(req, res, 409, { error: 'Account already exists with this username' });
	}

	const passwordHash = await bcrypt.hash(req.body.password, 12);

	await db.db().collection('accounts')
		.insertOne({
			_id: username,
			displayName: req.body.username,
			passwordHash: passwordHash,
			domains: [],
			allowedTemplates: ['basic'],
			onboarding: true,
			maxDomains: 5,
		});

	return dynamicResponse(req, res, 302, { redirect: '/login' });

};

/**
 * POST /forms/logout
 * logout
 */
export function logout(req, res) {
	req.session.destroy();
	return dynamicResponse(req, res, 302, { redirect: '/login' });
};

/**
 * POST /forms/onboarding
 * update onboarding step
 */
export async function updateOnboarding(req, res) {
	if (!res.locals.user) {
		return dynamicResponse(req, res, 400, { error: 'Bad request' });
	}
	const step = req.body.step;
	if (!step || isNaN(step) || parseInt(step) !== +step) {
		return dynamicResponse(req, res, 400, { error: 'Bad request' });
	}
	await db.db().collection('accounts')
		.updateOne({
			_id: res.locals.user.username
		}, {
			'$set': {
				onboarding: parseInt(step),
			}
		});
	return dynamicResponse(req, res, 302, { redirect: '/account' });
};

/**
 * GET /billing
 * billing page
 */
export async function billingPage(app, req, res, next) {
	const [data, invoices] = await Promise.all([
		accountData(req, res, next),
		db.db().collection('invoices').find({ username: res.locals.user.username }).sort({ _id: -1 }).toArray(),
	]);
	res.locals.data = { ...data, invoices, user: res.locals.user };
	return app.render(req, res, '/billing');
}

/**
 * GET /billing.json
 * billing page json data
 */
export async function billingJson(req, res, next) {
	const [data, invoices] = await Promise.all([
		accountData(req, res, next),
		db.db().collection('invoices').find({ username: res.locals.user.username }).sort({ _id: -1 }).toArray(),
	]);
	return res.json({ ...data, invoices, user: res.locals.user });
}

/**
 * POST /forms/billing/payment_request
 * billing page json data
 */
export async function createPaymentRequest(req, res) {

	const { invoiceId } = req.body;

	if (!invoiceId || typeof invoiceId !== 'string' || invoiceId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invoice ID is required' });
	}

	try {

		//check if invoice exists
		const invoice = await db.db().collection('invoices').findOne({
			username: res.locals.user.username,
			_id: ObjectId(invoiceId)
		});

		if (!invoice) {
			return dynamicResponse(req, res, 404, { error: 'Invoice not found' });
		}

		const shkeeperManager = new ShkeeperManager();
		const shkeeperResponse = await shkeeperManager.createPaymentRequest(
			'LTC',  //TODO: option on frontend, add backend check above for supported cryptos (or use shkeeper api available wallets api?)
			invoice._id.toString(),
			invoice.amount
		);

		if (!shkeeperResponse || !shkeeperResponse.wallet) {
			console.warn('shkeeperResponse:', shkeeperResponse);
			return dynamicResponse(req, res, 500, { error: 'Payment gateway error, try again later' });
		}

		const qrCodeURL = shkeeperResponse.wallet;
		const qrCodeText = await QRCode.toString(qrCodeURL, { type: 'utf8' });

		// Return the SHKeeper response to the client
		return dynamicResponse(req, res, 200, { shkeeperResponse, qrCodeText });

	} catch (error) {
		console.error('Error processing payment request:', error);
		return dynamicResponse(req, res, 500, { error: 'Internal server error' });
	}
};
