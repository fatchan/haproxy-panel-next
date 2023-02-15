const bcrypt = require('bcrypt');
const db = require('../db.js');
const { validClustersString, makeArrayIfSingle, extractMap, dynamicResponse, getMaps } = require('../util.js');

/**
 * account page data shared between html/json routes
 */
exports.accountData = async (req, res, next) => {
	let maps = []
		, globalAcl;
	if (res.locals.user.clusters.length > 0) {
		maps = await res.locals.dataPlane.getAllRuntimeMapFiles()
			.then(res => res.data)
			.then(data => data.map(extractMap))
			.then(maps => maps.sort((a, b) => a.fname.localeCompare(b.fname)));
		const globalIndex = await res.locals.dataPlane.getAcls({
				parent_name: 'http-in',
				parent_type:'frontend'
			})
			.then(res => res.data.data)
			.then(acls => acls.find(a => a.acl_name === 'ddos_mode_enabled_override').index)
		globalAcl = await res.locals.dataPlane.getAcl({
				index: globalIndex,
				parent_name: 'http-in',
				parent_type:'frontend'
			})
			.then(res => res.data.data)
	}
	return {
		csrf: req.csrfToken(),
		maps,
		globalAcl: globalAcl && globalAcl.value.endsWith(0),
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
		return dynamicResponse(req, res, 403, { error: 'Only admin can toggle global' });
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
	return dynamicResponse(req, res, 302, { redirect: '/account' });
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
		return dynamicResponse(req, res, 403, { error: 'Incorrect username or password' });
	}
	const passwordMatch = await bcrypt.compare(password, account.passwordHash);
	if (passwordMatch === true) {
		req.session.user = account._id;
		return dynamicResponse(req, res, 302, { redirect: '/account' });
	}
	return dynamicResponse(req, res, 403, { error: 'Incorrect username or password' });
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
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}

	if (password !== rPassword) {
		return dynamicResponse(req, res, 400, { error: 'Passwords did not match' });
	}

	const existingAccount = await db.db.collection('accounts').findOne({ _id: username });
	if (existingAccount) {
		return dynamicResponse(req, res, 409, { error: 'Account already exists with this username' });
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

	return dynamicResponse(req, res, 302, { redirect: '/login' });
};

/**
 * POST /forms/logout
 * logout
 */
exports.logout = (req, res) => {
	req.session.destroy();
	return dynamicResponse(req, res, 302, { redirect: '/login' });
};
