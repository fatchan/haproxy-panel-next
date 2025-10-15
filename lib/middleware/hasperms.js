import { dynamicResponse } from '../../util.js';

function one(requiredPermission) {
	return function(req, res, next) {
		console.log(res.locals.permissions);
		if (!res.locals.permissions.get(requiredPermission)) {
			return dynamicResponse(req, res, 403, { error: 'no permission' });
		}
		next();
	};
}

function all(...requiredPermissions) {
	return function(req, res, next) {
		if (!res.locals.permissions.hasAll(...requiredPermissions)) {
			return dynamicResponse(req, res, 403, { error: 'no permission' });
		}
		next();
	};
}

function any(...requiredPermissions) {
	return function(req, res, next) {
		if (!res.locals.permissions.hasAny(...requiredPermissions)) {
			return dynamicResponse(req, res, 403, { error: 'no permission' });
		}
		next();
	};
}

export { one, all, any };
