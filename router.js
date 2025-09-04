import express from 'express';
import csrf from 'csurf';
import ShkeeperManager from './lib/billing/shkeeper.js';
import swaggerUi from 'swagger-ui-express';
import swaggerCss from './lib/swagger/css.js';
import swaggerDocument from './openapi/basedflare.json' with { type: 'json' };

import * as accountController from './controllers/account.js';
import * as incidentsController from './controllers/incidents.js';
import * as mapsController from './controllers/maps.js';
import * as certsController from './controllers/certs.js';
import * as dnsController from './controllers/dns.js';
import * as domainsController from './controllers/domains.js';
import * as billingController from './controllers/billing.js';
import * as statsController from './controllers/stats.js';
import * as templateController from './controllers/templates.js';
import * as cacheController from './controllers/cache.js';
import * as streamsController from './controllers/stream.js';
import * as apikeysController from './controllers/apikeys.js';

import {
	useSession, fetchSession, checkSession, checkOnboarding, adminCheck,
} from './lib/middleware/session.js';
import { useHaproxy } from './lib/middleware/haproxy.js';
import { useVarnish } from './lib/middleware/varnish.js';
import { useOvenMedia } from './lib/middleware/oven.js';

const mapNamesOrString = [
	process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME, process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME,
	process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME, process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME,
	process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME, process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME,
	process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME, process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
	process.env.NEXT_PUBLIC_DDOS_MAP_NAME, process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME,
	process.env.NEXT_PUBLIC_HOSTS_MAP_NAME, process.env.NEXT_PUBLIC_REWRITE_MAP_NAME,
	process.env.NEXT_PUBLIC_IMAGES_MAP_NAME, process.env.NEXT_PUBLIC_CSS_MAP_NAME].join('|');

export default function router(server, app) {
	const shkeeperManager = new ShkeeperManager();
	const csrfHandler = csrf();
	const csrfMiddleware = (req, res, next) => {
		if (res.locals.isApiKey === true) {
			req.csrfToken = () => ''; // Api keys dont require this
			next();
		} else {
			csrfHandler(req, res, next);
		}
	};

	server.use('/api-docs', swaggerUi.serve);
	server.get(
		'/api-docs', swaggerUi.setup(swaggerDocument, {
			customCss: swaggerCss,
		}),);

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

	//common middlewares
	const sessionChain = [useSession, fetchSession, checkSession];
	const haproxyCsrfChain = [useHaproxy, csrfMiddleware];

	//register/login/logout/onboarding forms
	server.post('/forms/login', useSession, accountController.login);
	server.post('/forms/onboarding', sessionChain, accountController.updateOnboarding,);
	server.post('/forms/logout', useSession, accountController.logout);
	server.post('/forms/register', useSession, fetchSession, accountController.register,);
	server.post('/forms/requestchangepassword', useSession, accountController.requestPasswordChange,);
	server.post('/forms/changepassword', useSession, accountController.changePassword,);
	server.post('/forms/verifyemail', useSession, accountController.verifyEmail);

	//authed pages
	server.get('/dashboard', sessionChain, checkOnboarding, haproxyCsrfChain, accountController.dashboardPage.bind(null, app),);
	server.get('/cache', sessionChain, checkOnboarding, haproxyCsrfChain, cacheController.cachePage.bind(null, app),);
	server.get('/account', sessionChain, checkOnboarding, csrfMiddleware, accountController.accountPage.bind(null, app),);
	server.get('/csr', sessionChain, checkOnboarding, csrfMiddleware, certsController.csrPage.bind(null, app),);
	server.get('/onboarding', sessionChain, haproxyCsrfChain, accountController.onboardingPage.bind(null, app),);
	server.get('/account.json', sessionChain, checkOnboarding, haproxyCsrfChain, accountController.accountJson,);
	server.get('/incidents.json', sessionChain, incidentsController.incidentsJson,);
	server.get('/onboarding.json', sessionChain, haproxyCsrfChain, accountController.onboardingJson,);
	server.get(`/map/:name(${mapNamesOrString})`, sessionChain, checkOnboarding, haproxyCsrfChain, mapsController.mapPage.bind(null, app),);
	server.get(`/map/:name(${mapNamesOrString}).json`, sessionChain, checkOnboarding, haproxyCsrfChain, mapsController.mapJson,);
	server.get('/domains', sessionChain, csrfMiddleware, domainsController.domainsPage.bind(null, app),);
	server.get('/domains.json', sessionChain, csrfMiddleware, domainsController.domainsJson,);
	server.get('/apikeys', sessionChain, csrfMiddleware, apikeysController.apiKeysPage.bind(null, app),);
	server.get('/apikeys.json', sessionChain, csrfMiddleware, apikeysController.apiKeysJson,);
	server.get('/dns/:domain([a-zA-Z0-9-\.]+)/new', sessionChain, csrfMiddleware, dnsController.dnsRecordPage.bind(null, app),);
	server.get('/dns/:domain([a-zA-Z0-9-\.]+).json', sessionChain, csrfMiddleware, dnsController.dnsDomainJson,);
	server.get('/dns/:domain([a-zA-Z0-9-\.]+)', sessionChain, csrfMiddleware, dnsController.dnsDomainPage.bind(null, app),);
	server.get('/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z]+).json', sessionChain, csrfMiddleware, dnsController.dnsRecordJson,);
	server.get('/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z]+)', sessionChain, csrfMiddleware, dnsController.dnsRecordPage.bind(null, app),);
	server.get('/down', sessionChain, csrfMiddleware, dnsController.downPage.bind(null, app),);
	server.get('/down.json', sessionChain, csrfMiddleware, dnsController.downJson,);
	server.get('/certs', sessionChain, checkOnboarding, haproxyCsrfChain, certsController.certsPage.bind(null, app),);
	server.get('/certs.json', sessionChain, checkOnboarding, haproxyCsrfChain, certsController.certsJson,);

	const formsRouter = express.Router({ caseSensitive: true });
	formsRouter.post('/cache/purge', sessionChain, useVarnish, csrfMiddleware, cacheController.purgeURL,);
	formsRouter.post('/global/toggle', sessionChain, haproxyCsrfChain, accountController.globalToggle,);
	formsRouter.post(`/map/:name(${mapNamesOrString})/add`, sessionChain, haproxyCsrfChain, mapsController.patchMapForm,);
	formsRouter.delete(`/map/:name(${mapNamesOrString})/delete`, sessionChain, haproxyCsrfChain, mapsController.deleteMapForm,);
	formsRouter.delete('/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z_:]+)/delete', sessionChain, csrfMiddleware, dnsController.dnsRecordDelete,);
	formsRouter.post('/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z_:]+)', sessionChain, csrfMiddleware, dnsController.dnsRecordUpdate,);
	formsRouter.post('/domain/add', sessionChain, haproxyCsrfChain, domainsController.addDomain,);
	formsRouter.delete('/domain/delete', sessionChain, haproxyCsrfChain, domainsController.deleteDomain,);
	formsRouter.post('/apikey/add', sessionChain, haproxyCsrfChain, apikeysController.addApiKey,);
	formsRouter.delete('/apikey/delete', sessionChain, haproxyCsrfChain, apikeysController.deleteApiKey,);
	formsRouter.post('/cert/add', sessionChain, haproxyCsrfChain, certsController.addCert,);
	formsRouter.post('/cert/upload', sessionChain, haproxyCsrfChain, certsController.uploadCert,);
	formsRouter.delete('/cert/delete', sessionChain, haproxyCsrfChain, certsController.deleteCert,);
	formsRouter.post('/csr/verify', sessionChain, csrfMiddleware, certsController.verifyUserCSR,);
	formsRouter.get('/csrf', sessionChain, csrfMiddleware, (req, res, _next) => {
		return res.send(req.csrfToken());
	});

	formsRouter.post('/template', sessionChain, csrfMiddleware, adminCheck, templateController.upsertTemplates,);
	formsRouter.post('/update', sessionChain, csrfMiddleware, adminCheck, templateController.updateTemplates,);
	formsRouter.post('/down', sessionChain, csrfMiddleware, adminCheck, templateController.updateDownIPs,);

	if (process.env.LOKI_BASE_URL) {
		server.get('/stats', sessionChain, checkOnboarding, csrfMiddleware, statsController.statsPage.bind(null, app),);
		server.get('/stats.json', sessionChain, csrfMiddleware, statsController.statsJson,);
	}

	if (process.env.NEXT_PUBLIC_ENABLE_SHKEEPER) {
		server.get('/billing', sessionChain, csrfMiddleware, billingController.billingPage.bind(null, app),);
		server.get('/billing.json', sessionChain, csrfMiddleware, billingController.billingJson,);
		formsRouter.post('/billing/payment_request', sessionChain, csrfMiddleware, billingController.createPaymentRequest,);
		server.post('/forms/billing/callback', shkeeperManager.handleCallback);
	}

	if (process.env.NEXT_PUBLIC_OME_ORIGIN_HOSTNAME) {
		server.get('/streams', sessionChain, csrfMiddleware, useOvenMedia, streamsController.streamsPage.bind(null, app),);
		server.get('/streams.json', sessionChain, csrfMiddleware, useOvenMedia, streamsController.streamsJson,);
		server.get('/streams/viewcounts.json', sessionChain, csrfMiddleware, useOvenMedia, streamsController.streamsViewcountsJson,);
		formsRouter.post('/stream', sessionChain, csrfMiddleware, useOvenMedia, streamsController.addStream,);
		formsRouter.post('/stream/:id([a-zA-Z0-9-_]+)/conclude', sessionChain, csrfMiddleware, useOvenMedia, streamsController.concludeStream,);
		formsRouter.post('/stream/:id([a-zA-Z0-9-_]+)/restart', sessionChain, csrfMiddleware, useOvenMedia, streamsController.restartStream,);
		formsRouter.post('/stream/:id([a-zA-Z0-9-_]+)/toggle', sessionChain, csrfMiddleware, useOvenMedia, streamsController.toggleStream,);
		formsRouter.delete('/stream/:id([a-zA-Z0-9-_]+)', sessionChain, csrfMiddleware, useOvenMedia, streamsController.deleteStream,);
		formsRouter.post('/stream/webhook', sessionChain, csrfMiddleware, useOvenMedia, streamsController.addStreamWebhook,);
		formsRouter.delete('/stream/webhook/:id([a-f0-9]{24})', sessionChain, csrfMiddleware, useOvenMedia, streamsController.deleteStreamWebhook,);
		server.post('/forms/stream/admissions-webhook', useOvenMedia, streamsController.admissionsWebhook,);
		server.post('/forms/stream/alert-webhook', useOvenMedia, streamsController.alertWebhook,);
	}

	server.use('/forms', formsRouter);
}
