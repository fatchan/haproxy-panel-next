const db = require('../db.js');
const url = require('url');
const { deleteFromMap } = require('../util.js');

/**
 * GET /domains
 * domains page
 */
exports.domainsPage = async (app, req, res) => {
	return app.render(req, res, '/domains', {
		csrf: req.csrfToken(),
	});
};

/**
 * GET /domains.json
 * domains json data
 */
exports.domainsJson = async (req, res) => {
	return res.json({
		csrf: req.csrfToken(),
		user: res.locals.user,
	});
};

/**
 * POST /domain/add
 * add domain
 */
exports.addDomain = async (req, res) => {

	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0) {
		return res.status(400).send('Invalid input');
	}

	try {
		const { hostname } = url.parse(`https://${req.body.domain}`);
	} catch (e) {
		return res.status(400).send('Invalid input');
	}

	//todo: somehow enforce payment? or probably not for now, lol

	await db.db.collection('accounts')
		.updateOne({_id: res.locals.user.username}, {$addToSet: {domains: req.body.domain }});

	return res.redirect('/domains');
};

/**
 * POST /domain/delete
 * delete domain
 */
exports.deleteDomain = async (req, res) => {

	if (!req.body.domain || typeof req.body.domain !== 'string' || req.body.domain.length === 0
		|| !res.locals.user.domains.includes(req.body.domain)) {
		return res.status(400).send('Invalid input');
	}

	//will fail if domain is only in the hosts map for a different cluster, so we wont do it (for now)
	//but will cause permission problems "invalid input" when trying to delete it from the other cluster later... hmmm...
	//await deleteFromMap(res.locals.haproxy, process.env.HOSTS_MAP_NAME, [req.body.domain]);

	await db.db.collection('accounts')
		.updateOne({_id: res.locals.user.username}, {$pull: {domains: req.body.domain }});

	return res.redirect('/domains');

};
