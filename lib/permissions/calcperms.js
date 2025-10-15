import { Permissions } from './permissions.js';
import Permission from './permission.js';
import Roles from './roles.js';

export default function calcPerms(req, res) {

	let calculatedPermissions;

	const user = res?.locals?.originalUser;
	if (req.session && user) {

		calculatedPermissions = new Permission(); //TODO: account perms (consider overlap w/ capabilities)

		if (res.locals.org != null) {
			let orgPermissions; // org perms
			if (res.locals.org.members[user.username] != null) {
				orgPermissions = new Permission(res.locals.org.members[user.username].permissions.toString('base64')); //todo: move tostring into org db methods?
			}
			if (orgPermissions) {
				//set their org level perms calculated from orgPermissions and _ORG_BITS
				for (const bit of Permissions._ORG_BITS) {
					const inheritOrGlobal = calculatedPermissions.get(bit) //acc perms
						|| orgPermissions.get(bit); //org perms
					calculatedPermissions.set(bit, inheritOrGlobal);
				}
			}
		}

		// TODO: implement applyInheritance
		// calculatedPermissions.applyInheritance();

	} else {
		//not logged in, gets default anon permission
		calculatedPermissions = new Permission(Roles.roles.ANON.base64);
	}

	return calculatedPermissions;

}
