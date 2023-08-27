const express = require('express')
    , dev = process.env.NODE_ENV !== 'production'
	, session = require('express-session')
	, MongoStore = require('connect-mongo')
	, db = require('./db.js')
	, csrf = require('csurf')
	, OpenAPIClientAxios = require('openapi-client-axios').default
	, { dynamicResponse } = require('./util.js')
	, definition = require('./specification_openapiv3.js')
	, fetch = require('node-fetch')
	, FormData = require('form-data')
	, update = require('./update.js')
	, agent = require('./agent.js');

const testRouter = (server, app) => {

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
			}
		});

		const useSession = (req, res, next) => {
			sessionStore(req, res, next);
		};

		const fetchSession = async (req, res, next) => {
			if (req.session.user) {
				const account = await db.db.collection('accounts')
					.findOne({ _id: req.session.user });
				if (account) {
					const numCerts = await db.db.collection('certs')
						.countDocuments({ username: account._id });
					const strippedClusters = account.clusters
						.map(c => {
							return c.split(',')
								.map(clusterString => {
									const clusterUrl = new URL(clusterString);
									clusterUrl.username = '';
									clusterUrl.password = '';
									return clusterUrl.toString();
								})
								.join(',');
						});
					res.locals.clusters = account.clusters;
					res.locals.user = {
						username: account._id,
						domains: account.domains,
						clusters: strippedClusters,
						activeCluster: account.activeCluster,
						onboarding: account.onboarding,
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
			if (!res.locals.user || res.locals.user.onboarding === false) {
				return dynamicResponse(req, res, 302, { redirect: '/onboarding' });
			}
			next();
		};

		const csrfMiddleware = csrf();

		//dataplaneapi middleware
		const useHaproxy = (req, res, next) => {
			if (res.locals.clusters.length === 0) {
				return next();
			}
			try {
				res.locals.fMap = server.locals.fMap;
				res.locals.mapValueNames = server.locals.mapValueNames;
				const clusterUrls = res.locals.clusters[res.locals.user.activeCluster]
					.split(',')
					.map(u => new URL(u));
				const firstClusterURL = clusterUrls[0];

				//NOTE: all servers in cluster must have same credentials for now
				const base64Auth = Buffer.from(`${firstClusterURL.username}:${firstClusterURL.password}`).toString("base64");
				const api = new OpenAPIClientAxios({
					//definition: `${firstClusterURL.origin}/v2/specification_openapiv3`,
					definition,
					axiosConfigDefaults: {
						httpsAgent: agent,
						headers: {
							'authorization': `Basic ${base64Auth}`,
						}
					}
				});
				const apiInstance = api.initSync();
				apiInstance.defaults.baseURL = `${firstClusterURL.origin}/v2`;
				res.locals.dataPlane = apiInstance;
				function dataPlaneRetry(command, ...args) {
				    let retryCnt = 0;
				    function delay(t) {
				        return new Promise(resolve => {
				            setTimeout(resolve, t);
				        });
				    }
				    function run() {
				        return apiInstance[command](...args).catch(function (err) {
				            ++retryCnt;
				            apiInstance.defaults.baseURL = `${clusterUrls[retryCnt].origin}/v2`;
				            if (retryCnt > clusterUrls.length-1) {
				                console.error('Max retries exceeded in dataPlaneRetry', err.message);
				                throw err;
				            }
				            console.error('dataPlaneRetry retry', retryCnt, ' after error', err.message);
				            return delay(50).then(run);
				        });
				    }
				    return run();
				}
				res.locals.dataPlaneRetry = dataPlaneRetry;

				res.locals.dataPlaneAll = async (operationId, parameters, data, config, all=false) => {
					const promiseResults = await Promise.all(clusterUrls.map(clusterUrl => {
						const singleApi = new OpenAPIClientAxios({ definition, axiosConfigDefaults: { httpsAgent: agent, headers: { 'authorization': `Basic ${base64Auth}` } } });
						const singleApiInstance = singleApi.initSync();
						singleApiInstance.defaults.baseURL = `${clusterUrl.origin}/v2`;
						return singleApiInstance[operationId](parameters, data, { ...config, baseUrl: `${clusterUrl.origin}/v2` });
					}));
					return all ? promiseResults.map(p => p.data) : promiseResults[0]; //TODO: better desync handling
				}
				res.locals.postFileAll = async (path, options, file, fdOptions) => {
					//used  for stuff that dataplaneapi with axios seems to struggle with e.g. multipart body
					const promiseResults = await Promise.all(clusterUrls.map(clusterUrl => {
						const fd = new FormData(); //must resonctruct each time, or get a socket hang up
						fd.append('file_upload', file, fdOptions);
						return fetch(`${clusterUrl.origin}${path}`, { ...options, body: fd, agent }).then(resp => resp.json());
					}));
					return promiseResults[0]; //TODO: better desync handling
				}
				next();
			} catch (e) {
				console.error(e)
				return dynamicResponse(req, res, 500, { error: e });
			}
		};

		const hasCluster = (req, res, next) => {
			if (res.locals.user.clusters.length > 0 || (req.baseUrl+req.path) === '/forms/cluster/add') {
				return next();
			}
			return dynamicResponse(req, res, 302, { redirect: '/clusters' });
		};

		//Controllers
		const accountController = require('./controllers/account')
			, mapsController = require('./controllers/maps')
			, clustersController = require('./controllers/clusters')
			, certsController = require('./controllers/certs')
			, dnsController = require('./controllers/dns')
			, domainsController = require('./controllers/domains');

		//unauthed pages
		server.get('/', useSession, fetchSession, (req, res, next) => { return app.render(req, res, '/index') });
		server.get('/login', useSession, fetchSession, (req, res, next) => { return app.render(req, res, '/login') });
		server.get('/register', useSession, fetchSession, (req, res, next) => { return app.render(req, res, '/register') });

		//register/login/logout/onboarding forms
		server.post('/forms/login', useSession, accountController.login);
		server.post('/forms/onboarding', useSession, fetchSession, checkSession, accountController.finishOnboarding);
		server.post('/forms/logout', useSession, accountController.logout);
		server.post('/forms/register', useSession, fetchSession, accountController.register);

		const mapNames = [process.env.BLOCKED_MAP_NAME, process.env.MAINTENANCE_MAP_NAME, process.env.WHITELIST_MAP_NAME, process.env.REDIRECT_MAP_NAME,
				process.env.BACKENDS_MAP_NAME, process.env.DDOS_MAP_NAME, process.env.DDOS_CONFIG_MAP_NAME, process.env.HOSTS_MAP_NAME, process.env.REWRITE_MAP_NAME]
			, mapNamesOrString = mapNames.join('|');

		//authed pages
		server.get('/account', useSession, fetchSession, checkSession, checkOnboarding, useHaproxy, csrfMiddleware, accountController.accountPage.bind(null, app));
		server.get('/onboarding', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, accountController.onboardingPage.bind(null, app));
		server.get('/account.json', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, accountController.accountJson);
		server.get(`/map/:name(${mapNamesOrString})`, useSession, fetchSession, checkSession, checkOnboarding, useHaproxy, hasCluster, csrfMiddleware, mapsController.mapPage.bind(null, app));
		server.get(`/map/:name(${mapNamesOrString}).json`, useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, mapsController.mapJson);
		server.get('/clusters', useSession, fetchSession, checkSession, checkOnboarding, csrfMiddleware, clustersController.clustersPage.bind(null, app));
		server.get('/clusters.json', useSession, fetchSession, checkSession, csrfMiddleware, clustersController.clustersJson);
		server.get('/domains', useSession, fetchSession, checkSession, csrfMiddleware, domainsController.domainsPage.bind(null, app));
		server.get('/domains.json', useSession, fetchSession, checkSession, csrfMiddleware, domainsController.domainsJson);
		server.get('/dns/:domain([a-zA-Z0-9-\.]+)/new', useSession, fetchSession, checkSession, csrfMiddleware, dnsController.dnsRecordPage.bind(null, app));
		server.get('/dns/:domain([a-zA-Z0-9-\.]+).json', useSession, fetchSession, checkSession, csrfMiddleware, dnsController.dnsDomainJson);
		server.get('/dns/:domain([a-zA-Z0-9-\.]+)', useSession, fetchSession, checkSession, csrfMiddleware, dnsController.dnsDomainPage.bind(null, app));
		server.get('/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z]+).json', useSession, fetchSession, checkSession, csrfMiddleware, dnsController.dnsRecordJson);
		server.get('/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z]+)', useSession, fetchSession, checkSession, csrfMiddleware, dnsController.dnsRecordPage.bind(null, app));
		server.get('/certs', useSession, fetchSession, checkSession, checkOnboarding, useHaproxy, csrfMiddleware, certsController.certsPage.bind(null, app));
		server.get('/certs.json', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, certsController.certsJson);
		// server.get('/stats', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, accountController.statsPage.bind(null, app));
		// server.get('/stats.json', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, accountController.statsJson);
		const clusterRouter = express.Router({ caseSensitive: true });
		clusterRouter.post('/global/toggle', useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, accountController.globalToggle);
		clusterRouter.post(`/map/:name(${mapNamesOrString})/add`, useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, mapsController.patchMapForm);
		clusterRouter.post(`/map/:name(${mapNamesOrString})/delete`, useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, mapsController.deleteMapForm);
		clusterRouter.post('/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z_]+)/delete', useSession, fetchSession, checkSession, csrfMiddleware, dnsController.dnsRecordDelete);
		clusterRouter.post('/dns/:domain([a-zA-Z0-9-\.]+)/:zone([a-zA-Z0-9-\.@_]+)/:type([a-z_]+)', useSession, fetchSession, checkSession, csrfMiddleware, dnsController.dnsRecordUpdate);
		clusterRouter.post('/cluster', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, clustersController.setCluster);
		clusterRouter.post('/cluster/add', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, clustersController.addCluster);
		clusterRouter.post('/cluster/delete', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, clustersController.deleteClusters);
		clusterRouter.post('/domain/add', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, domainsController.addDomain);
		clusterRouter.post('/domain/delete', useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, domainsController.deleteDomain);
		clusterRouter.post('/cert/add', useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, certsController.addCert);
		clusterRouter.post('/cert/upload', useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, certsController.uploadCert);
		clusterRouter.post('/cert/delete', useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, certsController.deleteCert);
		clusterRouter.post('/csr/verify', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, certsController.verifyUserCSR);
		clusterRouter.post('/template', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, async (req, res, next) => {
			if (res.locals.user.username !== "admin") {
				return dynamicResponse(req, res, 403, { error: 'No permission' });
			}
			const { id, data } = req.body
			if (!id || !data) {
				return dynamicResponse(req, res, 403, { error: 'Invalid input' });
			}
			await db.db.collection('templates').updateOne({ _id: id }, { $set: { data } }, { upsert: true });
			return res.json({ ok: true });
		});
		clusterRouter.post('/update', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, async (req, res, next) => {
			if (res.locals.user.username !== "admin") {
				return dynamicResponse(req, res, 403, { error: 'No permission' });
			}
			await update();
			return res.json({ ok: true });
		});
		clusterRouter.post('/down', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, async (req, res, next) => {
			if (res.locals.user.username !== "admin") {
				return dynamicResponse(req, res, 403, { error: 'No permission' });
			}
			const ips = req.body.ips.filter(x => x && x.length > 0);
			if (ips.length === 0) {
				await db.db.collection('down').updateOne({ _id: 'down' }, { $set: { ips: [] } }, { upsert: true });
			} else {
				await db.db.collection('down').updateOne({ _id: 'down' }, { $addToSet: { ips: { '$each': ips } } }, { upsert: true });
			}
			return res.json({ ok: true });
		});
		clusterRouter.get('/csrf', useSession, fetchSession, checkSession, hasCluster, csrfMiddleware, (req, res, next) => {
			return res.send(req.csrfToken());
		});
		server.use('/forms', clusterRouter);

};

module.exports = testRouter;
