import calcPerms from '../permissions/calcperms.js';

export default function applyPermissions(req, res, next) {
	res.locals.permissions = calcPerms(req, res);
	next();
}
