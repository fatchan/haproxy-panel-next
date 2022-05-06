process
	.on('uncaughtException', console.error)
	.on('unhandledRejection', console.error);

//Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const HAProxy = require('@fatchan/haproxy-sdk');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const csrf = require('csurf');
const db = require('./db.js');

//Controllers
const mapsController = require('./controllers/maps');
const accountsController = require('./controllers/accounts');
const domainsController = require('./controllers/domains');

//Express setup
const app = express();
app.set('query parser', 'simple');
app.use(bodyParser.json({ extended: false })); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser(process.env.COOKIE_SECRET));
app.disable('x-powered-by');
app.set('view engine', 'pug');
app.set('views', './views/pages');
app.enable('view cache');
app.set('trust proxy', 1);

//template locals
app.locals.mapValueNames = { '0': 'None', '1': 'Proof-of-work', '2': 'hCaptcha' };
app.locals.fMap = require('./util.js').fMap;

async function run() {
	//Session & auth
	await db.connect();
	const sessionStore = session({
		secret: process.env.COOKIE_SECRET,
		store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
		resave: false,
		saveUninitialized: false,
		rolling: true,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 1000 * 60 * 60 * 24 * 7, //week
		}
	});
	const useSession = (req, res, next) => {
		sessionStore(req, res, next);
	}
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
			return res.redirect('/login');
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
			next();
		} catch (e) {
			res.status(500).send(e);
		}
	};

	const hasCluster = (req, res, next) => {
		if (res.locals.user.clusters.length > 0) {
			return next();
		}
		res.redirect('/clusters');
	}

	//static
	app.use('/static', express.static('static'));
	app.use('/static/css', express.static('node_modules/bootstrap/dist/css'));

	//unauthed pages
	app.get('/', useSession, fetchSession, accountsController.homePage);
	app.get('/login', useSession, fetchSession, accountsController.loginPage);
	app.get('/register', useSession, fetchSession, accountsController.registerPage);

	//register/login/logout
	app.post('/login', useSession, accountsController.login);
	app.post('/logout', useSession, accountsController.logout);
	app.post('/register', useSession, accountsController.register);

	//authed pages that dont require a cluster
	app.get('/account', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, accountsController.accountPage);
	app.get('/domains', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, domainsController.domainsPage);
	app.get('/clusters', useSession, fetchSession, checkSession, useHaproxy, csrfMiddleware, accountsController.clustersPage);

	//authed pages that useHaproxy
	const clusterRouter = express.Router({ caseSensitive: true });
	clusterRouter.post('/global/toggle', accountsController.globalToggle);
	clusterRouter.post('/cluster', accountsController.setCluster);
	clusterRouter.post('/cluster/add', accountsController.addCluster);
	clusterRouter.post('/cluster/delete', accountsController.deleteClusters);
	clusterRouter.post('/domain/add', domainsController.addDomain);
	clusterRouter.post('/domain/delete', domainsController.deleteDomain);
	clusterRouter.get(`/maps/:name(${process.env.BLOCKED_MAP_NAME}|${process.env.MAINTENANCE_MAP_NAME}|${process.env.WHITELIST_MAP_NAME}|${process.env.BLOCKED_MAP_NAME}|${process.env.DDOS_MAP_NAME}|${process.env.HOSTS_MAP_NAME})`, mapsController.getMapHtml);
	clusterRouter.post(`/maps/:name(${process.env.BLOCKED_MAP_NAME}|${process.env.MAINTENANCE_MAP_NAME}|${process.env.WHITELIST_MAP_NAME}|${process.env.DDOS_MAP_NAME}|${process.env.HOSTS_MAP_NAME})/add`, mapsController.patchMapForm); //add to MAP
	clusterRouter.post(`/maps/:name(${process.env.BLOCKED_MAP_NAME}|${process.env.MAINTENANCE_MAP_NAME}|${process.env.WHITELIST_MAP_NAME}|${process.env.DDOS_MAP_NAME}|${process.env.HOSTS_MAP_NAME})/delete`, mapsController.deleteMapForm); //delete from MAP
	app.use('/', useSession, fetchSession, checkSession, useHaproxy, hasCluster, csrfMiddleware, clusterRouter);

	app.listen(8080, () => {
		console.log('Running at http://localhost:8080 in %s mode', process.env.NODE_ENV);
	});

}

run();
