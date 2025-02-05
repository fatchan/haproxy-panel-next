import session from 'express-session';
import MongoStore from 'connect-mongo';
import * as db from '../../db.js';
import { dynamicResponse } from '../../util.js';

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
	let sessionUsername = req.session.user;
	if (!sessionUsername && req.headers['authorization']) {
		const authHeader = req.headers['authorization'];
		const parts = authHeader.split(' ');
		if (parts.length === 2 && parts[0] === 'Bearer') {
			const foundApiKey = await db.db().collection('apikeys').findOne({ key: parts[1] }, { projection: { key: 0 } });
			if (foundApiKey) {
				sessionUsername = foundApiKey.username; // Impersonation
			}
		}
	}
	if (sessionUsername) {
		const account = await db.db().collection('accounts')
			.findOne({ _id: sessionUsername });
		if (account) {
			const numCerts = await db.db().collection('certs')
				.countDocuments({ username: account._id });
			res.locals.user = {
				username: account._id,
				streamsId: account.streamsId,
				email: account.email || null,
				domains: account.domains,
				onboarding: account.onboarding,
				allowedTemplates: account.allowedTemplates,
				numCerts,
				emailVerified: account.email == null || account.emailVerified === true,
				billing: account.billing || null,
				maxDomains: account.maxDomains || 0,
			};
			return next();
		}
		req.session?.destroy();
	}
	next();
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

export const adminCheck = (req, res, next) => {
	if (res.locals.user.username !== 'admin') {
		return dynamicResponse(req, res, 403, { error: 'No permission' });
	}
	next();
};
