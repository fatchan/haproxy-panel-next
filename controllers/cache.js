import { dynamicResponse } from '../util.js';

/**
 * GET /cache
 * cache page
 */
export async function cachePage(app, req, res) {
	//TODO: any data about cache page i.e stats?
	res.locals.data = {
		user: res.locals.user,
		csrf: req.csrfToken(),
	};
	return app.render(req, res, '/cache');
};

/**
 * POST /cache/purge
 * add domain validation
 */
export async function purgeURL(req, res, _next) {

	if (!req.body.url || typeof req.body.url !== 'string' || req.body.url.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	try {
		const url = new URL(req.body.url);

		if (!res.locals.user.domains.includes(url.hostname)) {
			return dynamicResponse(req, res, 403, { error: 'Domain not authorized' });
		}
	} catch (error) {
		return dynamicResponse(req, res, 400, { error: 'Invalid URL format' });
	}

	await res.locals.purgeURL(req.body.url);

	return dynamicResponse(req, res, 302, { redirect: '/cache' });

}
