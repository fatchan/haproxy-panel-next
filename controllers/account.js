const bcrypt = require('bcrypt');
const db = require('../db.js');
const { validClustersString, makeArrayIfSingle, extractMap } = require('../util.js');

/**
 * account page data shared between html/json routes
 */
exports.accountData = async (req, res, next) => {
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
	return {
		csrf: req.csrfToken(),
		maps,
		acls,
		globalAcl: globalAcl && globalAcl.length === 1 && globalAcl[0].endsWith(0),
	}
};

/**
 * GET /account
 * account page html
 */
exports.accountPage = async (app, req, res, next) => {
	const data = await exports.accountData(req, res, next);
	return app.render(req, res, '/account', { ...data, user: res.locals.user });
}

/**
 * GET /account.json
 * account page json data
 */
exports.accountJson = async (req, res, next) => {
	const data = await exports.accountData(req, res, next);
	return res.json({ ...data, user: res.locals.user });
}

/**
 * POST /forms/global/toggle
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
 * POST /forms/login
 * login
 */
exports.login = async (req, res) => {
	const username = req.body.username.toLowerCase();
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
 * POST /forms/register
 * regiser
 */
exports.register = async (req, res) => {
	const username = req.body.username.toLowerCase();
	const password = req.body.password;
	const rPassword = req.body.repeat_password;

	if (!username || typeof username !== "string" || username.length === 0
		|| !password || typeof password !== "string" || password.length === 0
		|| !rPassword || typeof rPassword !== "string" || rPassword.length === 0) {
		//todo: length limits, make jschan input validator LGPL lib and use here
		return res.status(400).send('Invalid inputs');
	}

	if (password !== rPassword) {
		return res.status(400).send('Passwords did not match');
	}

	const existingAccount = await db.db.collection('accounts').findOne({ _id: username });
	if (existingAccount) {
		return res.status(409).send('Account already exists with that username');
	}

	const passwordHash = await bcrypt.hash(req.body.password, 12);

	await db.db.collection('accounts')
		.insertOne({
			_id: username,
			displayName: req.body.username,
			passwordHash: passwordHash,
			domains: [],
			clusters: [],
			activeCluster: 0,
			balance: 0,
		});

	return res.redirect('/login');
};

/**
 * POST /forms/logout
 * logout
 */
exports.logout = (req, res) => {
	req.session.destroy();
	return res.redirect('/login');
};
