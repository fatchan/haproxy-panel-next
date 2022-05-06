const bcrypt = require('bcrypt');
const db = require('../db.js');
const { validClustersString, makeArrayIfSingle, extractMap } = require('../util.js');

/**
 * GET /
 * home page
 */
exports.homePage = (req, res) => {
	return res.render('login');
};

/**
 * GET /login
 * login page
 */
exports.loginPage = (req, res) => {
	return res.render('login');
};

/**
 * GET /register
 * registration page
 */
exports.registerPage = (req, res) => {
	return res.render('register');
};

/**
 * GET /account
 * account page
 */
exports.accountPage = async (app, req, res, next) => {
	let maps = []
		, acls = []
		, globalAcl;
	if (res.locals.user.clusters.length > 0) {
		maps = await res.locals.haproxy
			.showMap()
			.then(list => {
				return list.map(extractMap)
					.filter(i => i && i.fname)
					.sort((a, b) => a.fname.localeCompare(b.fname));
			});
		let globalIndex;
		acls = await res.locals.haproxy
			.showAcl()
			.then(list => {
				const hdrCntAcl = list.find(x => x.includes("acl 'hdr_cnt'"));
				if (hdrCntAcl != null) {
					globalIndex = hdrCntAcl.split(' ')[0];
				}
				return list.map(extractMap)
					.filter(i => i);
			});
		globalAcl = await res.locals.haproxy
			.showAcl(globalIndex);
	}
	return app.render(req, res, '/account', {
		csrf: req.csrfToken(),
		maps,
		acls,
		globalAcl: globalAcl && globalAcl.length === 1 && globalAcl[0].endsWith(0),
	})
};

/**
 * GET /clusters
 * clusters page
 */
exports.clustersPage = async (req, res) => {
	return res.render('clusters', {
		csrf: req.csrfToken(),
	});
};

/**
 * POST /global/toggle
 * toggle global ACL
 */
exports.globalToggle = async (req, res, next) => {
	if (res.locals.user.username !== "admin") {
		res.status(403).send('only admin can toggle global');
	}
	let globalIndex;
	try {
		await res.locals.haproxy
			.showAcl()
			.then(list => {
				const hdrCntAcl = list.find(x => x.includes("acl 'hdr_cnt'"));
				if (hdrCntAcl != null) {
					globalIndex = hdrCntAcl.split(' ')[0];
				}
			});
		const globalAcl = await res.locals.haproxy
			.showAcl(globalIndex);
		if (globalAcl.length === 1 && globalAcl[0].endsWith(0)) {
			await res.locals.haproxy
				.clearAcl(globalIndex);
		} else {
			await res.locals.haproxy
				.addAcl(globalIndex, '0');
		}
	} catch (e) {
		return next(e);
	}
	return res.redirect('/account');
};

/**
 * POST /cluster
 * set active cluster
 */
exports.setCluster = async (req, res, next) => {
	if (res.locals.user.username !== "admin") {
		return res.status(403).send('only admin can change cluster');
	}
	if (!req.body || !req.body.cluster) {
		return res.status(400).send('invalid cluster');
	}
	req.body.cluster = parseInt(req.body.cluster, 10) || 0;
	if (!Number.isSafeInteger(req.body.cluster)
		|| req.body.cluster > res.locals.user.clusters.length-1) {
		return res.status(404).send('invalid cluster');
	}
	try {
		await db.db.collection('accounts')
			.updateOne({_id: res.locals.user.username}, {$set: {activeCluster: req.body.cluster }});
	} catch (e) {
		return next(e);
	}
	return res.redirect('/account');
};

/**
 * POST /cluster/add
 * add cluster
 */
exports.addCluster = async (req, res, next) => {
	if (res.locals.user.username !== "admin") {
		return res.status(403).send('only admin can add cluster');
	}
	if (!req.body || !req.body.cluster
		|| typeof req.body.cluster !== 'string'
		|| !validClustersString(req.body.cluster)) {
		return res.status(400).send('invalid cluster');
	}
	try {
		await db.db.collection('accounts')
			.updateOne({_id: res.locals.user.username}, {$addToSet: {clusters: req.body.cluster }});
	} catch (e) {
		return next(e);
	}
	return res.redirect('/clusters');
};

/**
 * POST /cluster/delete
 * delete cluster
 */
exports.deleteClusters = async (req, res, next) => {
	if (res.locals.user.username !== "admin") {
		return res.status(403).send('only admin can delete cluster');
	}
	const existingClusters = new Set(res.locals.user.clusters);
	req.body.cluster = makeArrayIfSingle(req.body.cluster);
	if (!req.body || !req.body.cluster
		|| !req.body.cluster.some(c => existingClusters.has(c))) {
		return res.status(400).send('invalid cluster');
	}
	const filteredClusters = res.locals.user.clusters.filter(c => !req.body.cluster.includes(c));
	if (filteredClusters.length === 0) {
		return res.status(400).send('cant delete last cluster');
	}
	let newActiveCluster = res.locals.user.activeCluster;
	if (res.locals.user.activeCluster > filteredClusters.length-1) {
		newActiveCluster = 0;
	}
	try {
		await db.db.collection('accounts')
			.updateOne({_id: res.locals.user.username}, {$set: {clusters: filteredClusters, activeCluster: newActiveCluster }});
	} catch (e) {
		return next(e);
	}
	return res.redirect('/clusters');
};

/**
 * POST /login
 * login
 */
exports.login = async (req, res) => {
	const username = req.body.username; //.toLowerCase();
	const password = req.body.password;
	const account = await db.db.collection('accounts').findOne({_id:username});
	if (!account) {
		return res.status(403).send('Incorrect username or password');
	}
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);
	if (passwordMatch === true) {
		req.session.user = account._id;
		return res.redirect('/account');
	}
	return res.status(403).send('Incorrect username or password');
};

/**
 * POST /register
 * regiser
 */
exports.register = async (req, res) => {
	const username = req.body.username; //.toLowerCase();
	const password = req.body.password;
	const rPassword = req.body.repeat_password;

	if (!username || typeof username !== "string" || username.length === 0
		|| !password || typeof password !== "string" || password.length === 0
		|| !rPassword || typeof rPassword !== "string" || rPassword.length === 0) {
		//todo: length limits, copy jschan input validator
		return res.status(400).send('Invalid inputs');
	}

	if (password !== rPassword) {
		return res.status(400).send('Passwords did not match');
	}

	const existingAccount = await db.db.collection('accounts').findOne({ _id: req.body.username });
	if (existingAccount) {
		return res.status(409).send('Account already exists with that username');
	}

	const passwordHash = await bcrypt.hash(req.body.password, 12);

	await db.db.collection('accounts')
		.insertOne({
			_id: req.body.username,
			passwordHash: passwordHash,
			domains: [],
			clusters: [],
			activeCluster: 0,
			balance: 0,
		});

	return res.redirect('/login');
};

/**
 * POST /logout
 * logout
 */
exports.logout = (req, res) => {
	req.session.destroy();
	return res.redirect('/login');
};
