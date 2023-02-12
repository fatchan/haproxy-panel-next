const HAProxy = require('@fatchan/haproxy-sdk')
	, express = require('express')
    , dev = process.env.NODE_ENV !== 'production'
	, session = require('express-session')
	, MongoStore = require('connect-mongo')
	, db = require('./db.js')
	, csrf = require('csurf')
	, { dynamicResponse } = require('./util.js');

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
				maxAge: 1000 * 60 * 60 * 24 * 7, //week
			}
		});
		
		const useSession = (req, res, next) => {
			sessionStore(req, res, next);
		};
		
		const fetchSession = async (req, res, next) => {
			if (req.session.user) {
				const account = await db.db.collection('accounts').findOne({_id:req.session.user});
				if (account) {
					res.locals.user = {
						username: account._id,
						domains: account.domains,
						clusters: account.clusters,
						activeCluster: account.activeCluster,
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
		
		const csrfMiddleware = csrf();

		//HAProxy-sdk middleware
		const useHaproxy = (req, res, next) => {
			if (res.locals.user.clusters.length === 0) {
				return next();
			}
			try {
				//uses cluster from account
				res.locals.haproxy = new HAProxy(res.locals.user.clusters[res.locals.user.activeCluster]);
				res.locals.fMap = server.locals.fMap;
				res.locals.mapValueNames = server.locals.mapValueNames;
				next();
			} catch (e) {
				return dynamicResponse(req, res, 500, { error: e });
			}
		};

		const hasCluster = (req, res, next) => {
			if (res.locals.user.clusters.length > 0) {
				return next();
			}
			return dynamicResponse(req, res, 302, { redirect: '/clusters' });
		};

		//Controllers
		const accountController = require('./controllers/account')
			, mapsController = require('./controllers/maps')
			, clustersController = require('./controllers/clusters')
			, domainsController = require('./controllers/domains');

		//unauthed pages
		server.get('/', useSession, fetchSession, (req, res, next) => { return app.render(req, res, '/index') });
		server.get('/login', useSession, fetchSession, (req, res, next) => { return app.render(req, res, '/login') });
		server.get('/register', useSession, fetchSession, (req, res, next) => { return app.render(req, res, '/register') });

		//register/login/logout forms
		server.post('/forms/login', useSession, accountController.login);
		server.post('/forms/logout', useSession, accountController.logout);
		server.post('/forms/register', useSession, accountController.register);

		const mapNames = [process.env.BLOCKED_MAP_NAME, process.env.MAINTENANCE_MAP_NAME, process.env.WHITELIST_MAP_NAME,
				process.env.BLOCKED_MAP_NAME, process.env.DDOS_MAP_NAME, process.env.HOSTS_MAP_NAME]
			, mapNamesOrString = mapNames.join('|');

		//authed pages that dont require a cluster
		server.get('/account', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, accountController.accountPage.bind(null, app));
		server.get('/account.json', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, accountController.accountJson);

		server.get(`/map/:name(${mapNamesOrString})`, useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, mapsController.mapPage.bind(null, app));
		server.get(`/map/:name(${mapNamesOrString}).json`, useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, mapsController.mapJson);
		
		server.get('/clusters', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, clustersController.clustersPage.bind(null, app));
		server.get('/clusters.json', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, clustersController.clustersJson);

		server.get('/domains', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, domainsController.domainsPage.bind(null, app));
		server.get('/domains.json', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, domainsController.domainsJson);

		//authed pages that useHaproxy
		const clusterRouter = express.Router({ caseSensitive: true });
		clusterRouter.post('/global/toggle', accountController.globalToggle);
		clusterRouter.post('/cluster', clustersController.setCluster);
		clusterRouter.post('/cluster/add', clustersController.addCluster);
		clusterRouter.post('/cluster/delete', clustersController.deleteClusters);
		clusterRouter.post('/domain/add', domainsController.addDomain);
		clusterRouter.post('/domain/delete', domainsController.deleteDomain);
		clusterRouter.post(`/map/:name(${mapNamesOrString})/add`, mapsController.patchMapForm); //add to MAP
		clusterRouter.post(`/map/:name(${mapNamesOrString})/delete`, mapsController.deleteMapForm); //delete from MAP
		server.use('/forms', useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, clusterRouter);

};

module.exports = testRouter;
