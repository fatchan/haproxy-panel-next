import bcrypt from 'bcrypt';
import * as db from '../db.js';
import { ObjectId } from 'mongodb';
import { extractMap, dynamicResponse } from '../util.js';
import sendEmail from '../lib/email/send.js';
import { Resolver } from 'node:dns/promises';
import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import * as redis from '../redis.js';
dotenv.config({ path: '.env' });

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
async function getNameserverTxtRecords () {
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
async function checkPublicDNSRecord (domain, type, expectedSet) {
	const results = await Promise.all(publicResolvers.map(async pr => {
		const res = await pr.resolve(domain, type);
		return new Set(res || []);
	}));
	return results.every(res => res.size === new Set([...res, ...expectedSet]).size);
}

/**
 * account page data shared between html/json routes
 */
export async function accountData (req, res, _next) {
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
export async function onboardingData (req, res, _next) {
	const firstDomain = res.locals.user.domains && res.locals.user.domains.length > 0 ? res.locals.user.domains[0] : null;
	const [anyBackend, nameserversPropagated] = await Promise.all([
		db.db().collection('mapnotes').findOne({ username: res.locals.user.username, map: 'hosts' }),
		firstDomain ? checkPublicDNSRecord(firstDomain, 'NS', expectedNameservers) : void 0,
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
export async function accountPage (app, req, res, next) {
	const data = await accountData(req, res, next);
	res.locals.data = { ...data, user: res.locals.user };
	return app.render(req, res, '/account');
}

/**
 * GET /dashboard
 * account page html
 */
export async function dashboardPage (app, req, res, next) {
	const data = await accountData(req, res, next);
	res.locals.data = { ...data, user: res.locals.user };
	return app.render(req, res, '/dashboard');
}

/**
 * GET /onboarding
 * account page html
 */
export async function onboardingPage (app, req, res, next) {
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
export async function accountJson (req, res, next) {
	const data = await accountData(req, res, next);
	return res.json({ ...data, user: res.locals.user });
}

/**
 * GET /incidents.json
 * get incidents from uptime kuma
 */
const uptimeKumaAuth = Buffer.from(
	`:${process.env.UPTIME_KUMA_API_KEY}`,
).toString('base64');
export async function incidentsJson (req, res, _next) {
	if (!process.env.UPTIME_KUMA_STATUS_URL) {
		console.warn('process.env.UPTIME_KUMA_STATUS_URL not set, skipping incident check');
		return res.json([]);
	}
	let cachedRes = await redis.lockQueueClient.get('incidents');
	if (cachedRes) {
		return res.json(JSON.parse(cachedRes));
	}
	const statusData = await fetch(process.env.UPTIME_KUMA_STATUS_URL, {
		headers: {
			'Authorization': uptimeKumaAuth
		}
	}).then(res => res.json());
	let incidents = [];
	if (statusData && statusData.maintenanceList && statusData.maintenanceList.length > 0) {
		incidents = statusData.maintenanceList;
	}
	await redis.lockQueueClient.set('incidents', JSON.stringify(incidents), 'EX', 300, 'NX');
	return res.json(incidents);
}

/**
 * GET /onboarding.json
 * onboarding page json data
 */
export async function onboardingJson (req, res, next) {
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
export async function globalToggle (req, res, next) {
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
	return dynamicResponse(req, res, 302, { redirect: '/dashboard' });
}

/**
 * POST /forms/login
 * login
 */
export async function login (req, res) {

	const username = req.body.username.toLowerCase();
	const password = req.body.password;

	if (!username || typeof username !== 'string' || username.length === 0 || !/^[a-zA-Z0-9]+$/.test(username)
		|| !password || typeof password !== 'string' || password.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (password.length > 100) {
		return dynamicResponse(req, res, 400, { error: 'Password must be 100 characters or less' });
	}

	const account = await db.db().collection('accounts').findOne({ _id: username });
	if (!account) {
		return dynamicResponse(req, res, 403, { error: 'Incorrect username or password' });
	}
	// if (account.emailVerified !== true) {
	// 	return dynamicResponse(req, res, 400, { error: 'Check your inbox to verify your email first' });
	// }
	if (account.inactive === true) {
		return dynamicResponse(req, res, 403, { error: 'Your account has been suspended for inactivity, please contact support.' });
	}
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);
	if (passwordMatch === true) {
		req.session.user = account._id;
		return dynamicResponse(req, res, 302, { redirect: '/dashboard' });
	}
	return dynamicResponse(req, res, 403, { error: 'Incorrect username or password' });
}

/**
 * POST /forms/register
 * regiser
 */
export async function register (req, res) {

	if (!res.locals.user || res.locals.user.username !== 'admin') {
		return dynamicResponse(req, res, 400, { error: 'Registration is currently invite-only, please email contact@ceoofbased.com to inquire about openings.' });
	}

	const username = req.body.username.toLowerCase();
	const email = req.body.email;
	const password = req.body.password;
	const rPassword = req.body.repeat_password;

	if (!username || typeof username !== 'string' || username.length === 0 || !/^[a-zA-Z0-9]+$/.test(username)
		|| !password || typeof password !== 'string' || password.length === 0
		|| !rPassword || typeof rPassword !== 'string' || rPassword.length === 0) {
		//todo: length limits, make jschan input validator LGPL lib and use here
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (password.length > 100 || rPassword.length > 100) {
		return dynamicResponse(req, res, 400, { error: 'Password must be 100 characters or less' });
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
			streamsId: ObjectId().toString(),
			email,
			emailVerified: false,
			displayName: req.body.username,
			passwordHash: passwordHash,
			domains: [],
			allowedTemplates: ['basic'],
			onboarding: true,
			maxDomains: 5,
			billing: { price: 0, description: 'Free trial' },
			inactive: false,
		});

	const token = randomBytes(32).toString('hex');
	await db.db().collection('verifications').insertOne({
		accountId: username,
		token,
		date: new Date(),
		type: 'verify_email'
	});
	const verifyLink = `${process.env.FRONTEND_URL}/verifyemail?token=${token}`;
	const emailBody = `To verify your email and complete registration, please click the link below:\n\n${verifyLink}\n\nIf you didn't request this, please ignore this email.`;
	await sendEmail(email, 'Complete Your Registration', emailBody);

	return dynamicResponse(req, res, 200, { message: 'Check your email inbox and follow the instructions to complete registration' });

};

/**
 * POST /forms/logout
 * logout
 */
export function logout (req, res) {
	req.session.destroy();
	return dynamicResponse(req, res, 302, { redirect: '/login' });
};

/**
 * POST /forms/onboarding
 * update onboarding step
 */
export async function updateOnboarding (req, res) {
	if (!res.locals.user) {
		return dynamicResponse(req, res, 400, { error: 'Bad request' });
	}
	const step = req.body.step;
	if (!step || isNaN(step) || parseInt(step, 10) !== +step) {
		return dynamicResponse(req, res, 400, { error: 'Bad request' });
	}
	await db.db().collection('accounts')
		.updateOne({
			_id: res.locals.user.username
		}, {
			'$set': {
				onboarding: parseInt(step, 10),
			}
		});
	return dynamicResponse(req, res, 302, { redirect: '/dashboard' });
};

/**
 * POST /forms/requestchangepassword
 * Verify password reset token and set new password
 */
export async function requestPasswordChange (req, res) {
	const email = req.body.email;

	if (!email || typeof email !== 'string' || email.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid email address' });
	}

	const account = await db.db().collection('accounts').findOne({ email: email.toLowerCase() });
	if (account) {
		const token = randomBytes(32).toString('hex'); //random token
		await db.db().collection('verifications').insertOne({
			accountId: account._id,
			token,
			date: new Date(),
			type: 'change_password'
		});
		const resetLink = `${process.env.FRONTEND_URL}/changepassword?token=${token}`;
		const emailBody = `To reset your password, please click the link below:\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.`;
		await sendEmail(email, 'Password Reset Request', emailBody);
	}

	return dynamicResponse(req, res, 200, { message: 'Check your inbox for instructions to reset your password.' });
}

/**
 * POST /forms/changepassword
 * Verify password reset token and set new password
 */
export async function changePassword (req, res) {
	const { token, password, repeat_password: rPassword } = req.body;

	if (!token || typeof token !== 'string' || token.length === 0
		|| !password || typeof password !== 'string' || password.length === 0
		|| !rPassword || typeof rPassword !== 'string' || rPassword.length === 0) {
		//todo: length limits, make jschan input validator LGPL lib and use here
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (password.length > 100 || rPassword.length > 100) {
		return dynamicResponse(req, res, 400, { error: 'Password must be 100 characters or less' });
	}

	if (password !== rPassword) {
		return dynamicResponse(req, res, 400, { error: 'Passwords do not match' });
	}

	const resetToken = await db.db().collection('verifications').findOneAndDelete({
		token,
		type: 'change_password'
	});

	if (!resetToken || !resetToken.value) {
		return dynamicResponse(req, res, 400, { error: 'Invalid or expired token' });
	}

	const passwordHash = await bcrypt.hash(password, 12);

	await db.db().collection('accounts').updateOne(
		{
			_id: resetToken.value.accountId
		},
		{
			$set: {
				passwordHash,
				emailVerified: true //also sets email to verified in case of missed/broken account verification email
			}
		}
	);

	return dynamicResponse(req, res, 200, { message: 'Password reset successfully' });
}

/**
 * POST /forms/verifyemail
 * Verify email after registration
 */
export async function verifyEmail (req, res) {
	const { token } = req.body;

	if (!token || typeof token !== 'string' || token.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	const verifyToken = await db.db().collection('verifications').findOneAndDelete({
		token,
		type: 'verify_email' //todo: put consts in lib
	});

	if (!verifyToken || !verifyToken.value) {
		return dynamicResponse(req, res, 400, { error: 'Invalid or expired token' });
	}

	await db.db().collection('accounts').updateOne(
		{ _id: verifyToken.value.accountId }, //username stored in the reset token
		{ $set: { emailVerified: true } }
	);

	return dynamicResponse(req, res, 302, { redirect: '/login?verify_email=1' });

}
