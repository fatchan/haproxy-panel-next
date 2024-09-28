import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import csrf from 'csurf';
import OpenAPIClientAxios from 'openapi-client-axios';
import fetch from 'node-fetch';
import FormData from 'form-data';
import ShkeeperManager from './billing/shkeeper.js';
import * as db from './db.js';
import { dynamicResponse } from './util.js';
import definition from './specification_openapiv3.js';
import update from './update.js';
import agent from './agent.js';

import * as accountController from './controllers/account.js';
import * as mapsController from './controllers/maps.js';
import * as certsController from './controllers/certs.js';
import * as dnsController from './controllers/dns.js';
import * as domainsController from './controllers/domains.js';

const dev = process.env.NODE_ENV !== 'production';

export default function router(server, app) {
	const shkeeperManager = new ShkeeperManager();
	const sessionStore = session({
		secret: process.env.COOKIE_SECRET,
		store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
		resave: false,
		saveUninitialized: false,
		rolling: true,
		cookie: {
			httpOnly: true,
			secure: !dev, //TODO: check https
			sameSite: 'strict',
			maxAge: 1000 * 60 * 60 * 24 * 30, //month
		},
	});

	const useSession = (req, res, next) => {
		sessionStore(req, res, next);
	};

	const fetchSession = async (req, res, next) => {
		if (req.session.user) {
			const account = await db.db().collection('accounts')
				.findOne({ _id: req.session.user });
			if (account) {
				const numCerts = await db.db().collection('certs')
					.countDocuments({ username: account._id });
				res.locals.user = {
					username: account._id,
					domains: account.domains,
					onboarding: account.onboarding,
					allowedTemplates: account.allowedTemplates,
					numCerts,
				};
				return next();
			}
			req.session.destroy();
		}
		next();
	};

	const checkSession = (req, res, next) => {
		if (!res.locals.user) {
			return dynamicResponse(req, res, 302, { redirect: '/login' });
		}
		next();
	};

	const checkOnboarding = (req, res, next) => {
		if (res.locals.user && res.locals.user.onboarding === false) {
			return dynamicResponse(req, res, 302, { redirect: '/onboarding' });
		}
		next();
	};

	const csrfMiddleware = csrf();

	const clusterUrls = process.env.DEFAULT_CLUSTER.split(',').map(u => new URL(u));

	//dataplaneapi middleware
	const useHaproxy = (req, res, next) => {
		try {
			res.locals.fMap = server.locals.fMap;
			res.locals.mapValueNames = server.locals.mapValueNames;
			const firstClusterURL = clusterUrls[0];

			//NOTE: all servers in cluster must have same credentials for now
			const base64Auth = Buffer.from(
				`${firstClusterURL.username}:${firstClusterURL.password}`,
			).toString('base64');
			const api = new OpenAPIClientAxios.default({
				//definition: `${firstClusterURL.origin}/v3/specification_openapiv3`,
				definition,
				axiosConfigDefaults: {
					httpsAgent: agent,
					headers: {
						'authorization': `Basic ${base64Auth}`,
					},
				},
			});
			const apiInstance = api.initSync();
			apiInstance.defaults.baseURL = `${firstClusterURL.origin}/v3`;
			res.locals.dataPlane = apiInstance;
			async function dataPlaneRetry(operationId, ...args) {
				let retryCnt = 0;
				console.log('dataplaneRetry', retryCnt, 'operation:', operationId);
				function run() {
					return apiInstance[operationId](...args).catch(function (err) {
						console.warn('dataplaneRetry error', retryCnt, 'error:', err);
						if (
							operationId === 'getRuntimeMapEntry' && err && err.response &&
							err.response.data && err.response.data.code === 404
						) {
							return null;
						}
						++retryCnt;
						console.error(
							'dataPlaneRetry retry',
							retryCnt,
							' after error',
							err,
						);
						console.trace();
						apiInstance.defaults.baseURL = `${clusterUrls[retryCnt].origin}/v3`;
						if (retryCnt > clusterUrls.length - 1) {
							console.error(
								'Max retries exceeded in dataPlaneRetry',
								err.message,
							);
							throw err;
						}
						return run();
					});
				}
				return run();
			}
			res.locals.dataPlaneRetry = dataPlaneRetry;

			res.locals.dataPlaneAll = async (
				operationId,
				parameters,
				data,
				config,
				all = false,
				blocking = true,
			) => {
				const promiseResults = await Promise[blocking ? 'all' : 'any'](
					clusterUrls.map(async (clusterUrl) => {
						const singleApi = new OpenAPIClientAxios.default({
							definition,
							axiosConfigDefaults: {
								httpsAgent: agent,
								headers: { 'authorization': `Basic ${base64Auth}` },
							},
						});
						const singleApiInstance = singleApi.initSync();
						singleApiInstance.defaults.baseURL = `${clusterUrl.origin}/v3`;
						console.time(`dataplaneAll ${clusterUrl.origin} ${operationId}`);
						let singleRes;
						try {
							singleRes = await singleApiInstance[operationId](parameters, data, {
								...config,
								baseUrl: `${clusterUrl.origin}/v3`,
							});
						} catch(e) {
							return e;
						}
						console.timeEnd(`dataplaneAll ${clusterUrl.origin} ${operationId}`);
						return singleRes;
					}),
				);
				console.log('dataplaneAll return, blocking:', blocking);
				return (all && blocking) ? promiseResults.map((p) => p.data) : promiseResults[0]; //TODO: better desync handling
			};
			res.locals.postFileAll = async (path, options, file, fdOptions) => {
				//used  for stuff that dataplaneapi with axios seems to struggle with e.g. multipart body
				const promiseResults = await Promise.all(
					clusterUrls.map((clusterUrl) => {
						const fd = new FormData(); //must resonctruct each time, or get a socket hang up
						fd.append('file_upload', file, fdOptions);
						return fetch(`${clusterUrl.origin}${path}`, {
							...options,
							body: fd,
							agent,
						}).then((resp) => resp.json());
					}),
				);
				return promiseResults[0]; //TODO: better desync handling
			};
			next();
		} catch (e) {
			console.error(e);
			return dynamicResponse(req, res, 500, { error: e });
		}
	};

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

	const mapNames = [
			process.env.BLOCKED_IP_MAP_NAME,
			process.env.BLOCKED_ASN_MAP_NAME,
			process.env.BLOCKED_CC_MAP_NAME,
			process.env.BLOCKED_CN_MAP_NAME,
			process.env.MAINTENANCE_MAP_NAME,
			process.env.WHITELIST_MAP_NAME,
			process.env.REDIRECT_MAP_NAME,
			process.env.BACKENDS_MAP_NAME,
			process.env.DDOS_MAP_NAME,
			process.env.DDOS_CONFIG_MAP_NAME,
			process.env.HOSTS_MAP_NAME,
			process.env.REWRITE_MAP_NAME,
		],
		mapNamesOrString = mapNames.join('|');

	//authed pages
	server.get(
		'/account',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		useHaproxy,
		csrfMiddleware,
		accountController.accountPage.bind(null, app),
	);
	server.get(
		'/onboarding',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		accountController.onboardingPage.bind(null, app),
	);
	server.get(
		'/account.json',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		useHaproxy,
		csrfMiddleware,
		accountController.accountJson,
	);
	server.get(
		'/onboarding.json',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		accountController.onboardingJson,
	);
	server.get(
		'/billing',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		accountController.billingPage.bind(null, app),
	);
	server.get(
		'/billing.json',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		accountController.billingJson,
	);
	server.get(
		`/map/:name(${mapNamesOrString})`,
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		useHaproxy,
		csrfMiddleware,
		mapsController.mapPage.bind(null, app),
	);
	server.get(
		`/map/:name(${mapNamesOrString}).json`,
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		useHaproxy,
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
		useHaproxy,
		csrfMiddleware,
		certsController.certsPage.bind(null, app),
	);
	server.get(
		'/certs.json',
		useSession,
		fetchSession,
		checkSession,
		checkOnboarding,
		useHaproxy,
		csrfMiddleware,
		certsController.certsJson,
	);

	const clusterRouter = express.Router({ caseSensitive: true });
	clusterRouter.post(
		'/global/toggle',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		accountController.globalToggle,
	);
	clusterRouter.post(
		`/map/:name(${mapNamesOrString})/add`,
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		mapsController.patchMapForm,
	);
	clusterRouter.post(
		`/map/:name(${mapNamesOrString})/delete`,
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
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
		useHaproxy,
		csrfMiddleware,
		domainsController.addDomain,
	);
	clusterRouter.post(
		'/domain/delete',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		domainsController.deleteDomain,
	);
	clusterRouter.post(
		'/cert/add',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		certsController.addCert,
	);
	clusterRouter.post(
		'/cert/upload',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
		csrfMiddleware,
		certsController.uploadCert,
	);
	clusterRouter.post(
		'/cert/delete',
		useSession,
		fetchSession,
		checkSession,
		useHaproxy,
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
	clusterRouter.post(
		'/template',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		async (req, res, _next) => {
			if (res.locals.user.username !== 'admin') {
				return dynamicResponse(req, res, 403, { error: 'No permission' });
			}
			if (!Array.isArray(req.body.templates) || req.body.templates.length === 0) {
				return dynamicResponse(req, res, 403, { error: 'Invalid input' });
			}
			const { type, template, data } = req.body.templates[0];
			if (!type || !template || !data) { //good enough for admin only route
				return dynamicResponse(req, res, 403, { error: 'Invalid input' });
			}
			const templateNames = req.body.templates.map(x => x.template);
			for (const rec of req.body.templates) {
				//upsert all the templates
				await db.db().collection('templates').updateOne({
					type: rec.type,
					template: rec.template,
				}, {
					$set: {
						type: rec.type,
						template: rec.template,
						data: rec.data,
					},
				}, { upsert: true });
			}
			//delete any no longer existing templates
			await db.db().collection('templates').deleteMany({
				type: type,
				template: { $nin: templateNames }
			});
			return res.json({ ok: true });
		},
	);
	clusterRouter.post(
		'/update',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		async (req, res, _next) => {
			if (res.locals.user.username !== 'admin') {
				return dynamicResponse(req, res, 403, { error: 'No permission' });
			}
			await update();
			return res.json({ ok: true });
		},
	);
	clusterRouter.post(
		'/down',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		async (req, res, _next) => {
			if (res.locals.user.username !== 'admin') {
				return dynamicResponse(req, res, 403, { error: 'No permission' });
			}
			const ips = req.body.ips.filter((x) => x && x.length > 0);
			if (ips.length === 0) {
				await db.db().collection('down').updateOne({ _id: 'down' }, {
					$set: { ips: [] },
				}, { upsert: true });
			} else {
				await db.db().collection('down').updateOne({ _id: 'down' }, {
					$addToSet: { ips: { '$each': ips } },
				}, { upsert: true });
			}
			return res.json({ ok: true });
		},
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

	//wip billing
	clusterRouter.post(
		'/billing/payment_request',
		useSession,
		fetchSession,
		checkSession,
		csrfMiddleware,
		accountController.createPaymentRequest,
	);
	server.post('/forms/billing/callback', (req, res, _next) => shkeeperManager.handleCallback(req, res));

	server.use('/forms', clusterRouter);
}
