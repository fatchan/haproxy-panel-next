import { dynamicResponse } from '../util.js';

// check that acocunt is admin
export default function adminCheck(req, res, next) {
	if (res.locals.user.username !== 'admin') {
		return dynamicResponse(req, res, 403, { error: 'No permission' });
	}
	next();
}
