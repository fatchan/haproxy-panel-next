import express from 'express';
import csrf from 'csurf';
import ShkeeperManager from './lib/billing/shkeeper.js';
import definition from './specification_openapiv3.js';
import agent from './agent.js';

import * as accountController from './controllers/account.js';
import * as mapsController from './controllers/maps.js';
import * as certsController from './controllers/certs.js';
import * as dnsController from './controllers/dns.js';
import * as domainsController from './controllers/domains.js';
import * as billingController from './controllers/billing.js';
import * as statsController from './controllers/stats.js';
import * as templateController from './controllers/templates.js';
import * as cacheController from './controllers/cache.js';

import {
	useSession,
	fetchSession,
	checkSession,
	checkOnboarding,
	adminCheck
} from './lib/middleware/session.js';
import {
	getHaproxy
} from './lib/middleware/haproxy.js';

export default function router(server, app) {

	const shkeeperManager = new ShkeeperManager();
	const csrfMiddleware = csrf();
	const clusterUrls = process.env.DEFAULT_CLUSTER.split(',').map(u => new URL(u));
	const haproxyMiddleware = getHaproxy(server, app, clusterUrls, agent, definition);

	//unauthed pages
	server.get('/', useSession, fetchSession, (req, res, _next) => {
		return app.render(req, res, '/index');
	});
	server.get('/login', useSession, fetchSession, (req, res, _next) => {
		return app.render(req, res, '/login');
	});
	server.get('/register', useSession, fetchSession, (req, res, _next) => {
		return app.render(req, res, '/register');
	});

	//register/login/logout/onboarding forms
	server.post('/forms/login', useSession, accountController.login);
	server.post(
		'/forms/onboarding',
		useSession,
		fetchSession,
		checkSession,
		accountController.updateOnboarding,
	);
	server.post('/forms/logout', useSession, accountController.logout);
	server.post(
		'/forms/register',
		useSession,
		fetchSession,
		accountController.register,
	);
	server.post(
		'/forms/requestchangepassword',
		useSession,
		accountController.requestPasswordChange,
	);
	server.post(
		'/forms/changepassword',
		useSession,
		accountController.changePassword,
	);
	server.post(
		'/forms/verifyemail',
		useSession,
		accountController.verifyEmail,
	);

	const mapNames = [
			process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME,
			process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME,
			process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME,
			process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME,
			process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME,
			process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME,
			process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME,
			process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
			process.env.NEXT_PUBLIC_DDOS_MAP_NAME,
			process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME,
			process.env.NEXT_PUBLIC_HOSTS_MAP_NAME,
			process.env.NEXT_PUBLIC_REWRITE_MAP_NAME,
			process.env.NEXT_PUBLIC_IMAGES_MAP_NAME,
			process.env.NEXT_PUBLIC_CSS_MAP_NAME,
			// 'translation',
		],
		mapNamesOrString = mapNames.join('|');

	//authed pages
	server.get(
		'/dashboard',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		haproxyMiddleware,
		csrfMiddleware,
		accountController.dashboardPage.bind(null, app),
	);
	server.get(
		'/cache',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		haproxyMiddleware,
		csrfMiddleware,
		cacheController.cachePage.bind(null, app),
	);
	server.get(
		'/account',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		csrfMiddleware,
		accountController.accountPage.bind(null, app),
	);
	server.get(
		'/csr',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		csrfMiddleware,
		certsController.csrPage.bind(null, app),
	);
	server.get(
		'/onboarding',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		accountController.onboardingPage.bind(null, app),
	);
	server.get(
		'/account.json',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		haproxyMiddleware,
		csrfMiddleware,
		accountController.accountJson,
	);
	server.get(
		'/onboarding.json',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		accountController.onboardingJson,
	);
	server.get(
		'/billing',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		billingController.billingPage.bind(null, app),
	);
	server.get(
		'/billing.json',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		billingController.billingJson,
	);
	server.get(
		'/stats',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		csrfMiddleware,
		statsController.statsPage.bind(null, app),
	);
	server.get(
		'/stats.json',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		statsController.statsJson,
	);
	server.get(
		`/map/:name(${mapNamesOrString})`,
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		haproxyMiddleware,
		csrfMiddleware,
		mapsController.mapPage.bind(null, app),
	);
	server.get(
		`/map/:name(${mapNamesOrString}).json`,
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		haproxyMiddleware,
		csrfMiddleware,
		mapsController.mapJson,
	);
	server.get(
		'/domains',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		domainsController.domainsPage.bind(null, app),
	);
	server.get(
		'/domains.json',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		domainsController.domainsJson,
	);
	server.get(
		'/dns/:domain([a-zA-Z0-9-\.]+)/new',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.dnsRecordPage.bind(null, app),
	);
	server.get(
		'/dns/:domain([a-zA-Z0-9-\.]+).json',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.dnsDomainJson,
	);
	server.get(
		'/dns/:domain([a-zA-Z0-9-\.]+)',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.dnsDomainPage.bind(null, app),
	);
	server.get(
		'/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z]+).json',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.dnsRecordJson,
	);
	server.get(
		'/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z]+)',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.dnsRecordPage.bind(null, app),
	);
	server.get(
		'/down',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.downPage.bind(null, app),
	);
	server.get(
		'/down.json',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.downJson,
	);
	server.get(
		'/certs',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		haproxyMiddleware,
		csrfMiddleware,
		certsController.certsPage.bind(null, app),
	);
	server.get(
		'/certs.json',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		haproxyMiddleware,
		csrfMiddleware,
		certsController.certsJson,
	);

	const clusterRouter = express.Router({ caseSensitive: true });
	clusterRouter.post(
		'/cache/purge',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		cacheController.purgeURL,
	);
	clusterRouter.post(
		'/global/toggle',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		accountController.globalToggle,
	);
	clusterRouter.post(
		`/map/:name(${mapNamesOrString})/add`,
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		mapsController.patchMapForm,
	);
	clusterRouter.post(
		`/map/:name(${mapNamesOrString})/delete`,
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		mapsController.deleteMapForm,
	);
	clusterRouter.post(
		'/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z_:]+)/delete',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.dnsRecordDelete,
	);
	clusterRouter.post(
		'/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z_:]+)',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		dnsController.dnsRecordUpdate,
	);
	clusterRouter.post(
		'/domain/add',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		domainsController.addDomain,
	);
	clusterRouter.post(
		'/domain/delete',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		domainsController.deleteDomain,
	);
	clusterRouter.post(
		'/cert/add',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		certsController.addCert,
	);
	clusterRouter.post(
		'/cert/upload',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		certsController.uploadCert,
	);
	clusterRouter.post(
		'/cert/delete',
		useSession,
		fetchSession,
		checkSession,
		haproxyMiddleware,
		csrfMiddleware,
		certsController.deleteCert,
	);
	clusterRouter.post(
		'/csr/verify',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		certsController.verifyUserCSR,
	);
	clusterRouter.get(
		'/csrf',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		(req, res, _next) => {
			return res.send(req.csrfToken());
		},
	);

	// admin template stuff
	clusterRouter.post(
		'/template',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		adminCheck,
		templateController.upsertTemplates
	);
	clusterRouter.post(
		'/update',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		adminCheck,
		templateController.update
	);
	clusterRouter.post(
		'/down',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		adminCheck,
		templateController.updateDownIPs
	);

	// billing
	clusterRouter.post(
		'/billing/payment_request',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		billingController.createPaymentRequest,
	);
	server.post('/forms/billing/callback', (req, res, _next) => shkeeperManager.handleCallback(req, res));

	server.use('/forms', clusterRouter);
}
