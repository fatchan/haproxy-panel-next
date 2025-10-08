import session from 'express-session';
import MongoStore from 'connect-mongo';
import { ObjectId } from 'mongodb';
import * as db from '../../db.js';
import { dynamicResponse } from '../../util.js';

async function getImpersonatingOrg(originalAccount, currentOrgId, impersonateOwner) {
	if (!currentOrgId || !impersonateOwner || originalAccount.onboarding === 7) {
		return { accountToUse: originalAccount, currentOrgId: null };
	}
	const org = await db.db().collection('orgs').findOne({ _id: new ObjectId(currentOrgId) });
	if (!org || !org.members || !org.members[originalAccount._id]) {
		return null;
	}
	const ownerAccount = await db.db().collection('accounts').findOne({ _id: org.owner });
	if (!ownerAccount) {
		return null;
	}
	return { accountToUse: ownerAccount, currentOrgId };
}

async function parseAuthApiKey(authHeader) {
	const parts = authHeader.split(' ');
	if (parts.length !== 2 || parts[0] !== 'Bearer') {
		return null;
	}
	const found = await db.db().collection('apikeys').findOne({ key: parts[1] }, { projection: { key: 0 } });
	return found || null;
}

export const sessionStore = session({
	secret: process.env.COOKIE_SECRET,
	store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
	resave: false,
	saveUninitialized: false,
	rolling: true,
	cookie: {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 1000 * 60 * 60 * 24 * 30, // month
	},
});

export const useSession = (req, res, next) => {
	sessionStore(req, res, next);
};

export const fetchSession = async (req, res, next) => {
	try {
		// handle session username vs API key
		let sessionUsername = req.session.user;
		if (req.headers.authorization) {
			sessionUsername = null;
			const auth = await parseAuthApiKey(req.headers.authorization);
			if (auth) {
				sessionUsername = auth.username;
				res.locals.isApiKey = true;
			}
		}

		if (!sessionUsername) {return next();}

		const originalAccount = await db.db().collection('accounts').findOne({ _id: sessionUsername });
		if (!originalAccount) {
			req.session?.destroy();
			return next();
		}

		res.locals.originalUser = {
			username: originalAccount._id,
			email: originalAccount.email || null,
			streamsId: originalAccount.streamsId,
			domains: originalAccount.domains,
			onboarding: originalAccount.onboarding,
			allowedTemplates: originalAccount.allowedTemplates,
			emailVerified: originalAccount.email == null || originalAccount.emailVerified === true,
			billing: originalAccount.billing || null,
			maxDomains: originalAccount.maxDomains || 0,
			cc: req.headers['x-continent-code']?.toLowerCase() || 'global',
		};

		// org impersonation
		const orgResult = await getImpersonatingOrg(originalAccount, req.session.currentOrg, req.session.impersonateOwner);
		if (!orgResult) {
			delete req.session.currentOrg;
			delete req.session.impersonateOwner;
			await req.session.save();
			// continue acting as originalAccount
		}

		const accountToUse = orgResult ? orgResult.accountToUse : originalAccount;
		const currentOrgId = orgResult ? orgResult.currentOrgId : null;

		const numCerts = await db.db().collection('certs').countDocuments({ username: accountToUse._id });

		res.locals.user = {
			username: accountToUse._id,
			streamsId: accountToUse.streamsId,
			domains: accountToUse.domains,
			onboarding: accountToUse.onboarding,
			allowedTemplates: accountToUse.allowedTemplates,
			numCerts,
			emailVerified: accountToUse.email == null || accountToUse.emailVerified === true,
			maxDomains: accountToUse.maxDomains || 0,
			cc: req.headers['x-continent-code']?.toLowerCase() || 'global',
			currentOrg: currentOrgId || null,
		};

		return next();
	} catch (err) {
		return next(err);
	}
};

export const checkSession = (req, res, next) => {
	if (!res.locals.user) {
		return dynamicResponse(req, res, 302, { redirect: '/login' });
	}
	next();
};

export const checkOnboarding = (req, res, next) => {
	if (res.locals.user && res.locals.user.onboarding === false) {
		return dynamicResponse(req, res, 302, { redirect: '/onboarding' });
	}
	next();
};

export const fetchAdmin = (_req, res, next) => {
	//no impersonating admin
	if (res.locals.user
		&& res.locals.user.username === res.locals.originalUser.username
		&& res.locals.originalUser.username === 'admin') {
		res.locals.isAdmin = true;
	}
	next();
};
export const adminCheck = (req, res, next) => {
	//no impersonating admin
	if (res.locals.user.username !== res.locals.originalUser.username
		|| res.locals.originalUser.username !== 'admin'
		|| !res.locals.isAdmin) {
		return dynamicResponse(req, res, 403, { error: 'No permission' });
	}
	next();
};
