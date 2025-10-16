import Permission from './permission.js';
import { Permissions } from './permissions.js';

//temp until bootstrapping and customisable base roles
const ORG_OWNER = (() => {
	const p = new Permission();
	p.set(Permissions.ORG_OWNER);
	return p;
})();

const roles = {
	ANON: new Permission(),
	ORG_MEMBER: new Permission(),
	ORG_OWNER,
};

// base64 strings (Permission.base64) to display names
const permissionsToName = {
	[roles.ANON.base64]: 'Regular User',
	[roles.ORG_OWNER.base64]: 'Org Owner',
	//TODO
};

// role key to display name
const roleToName = {
	ANON: 'Regular User',
	//TODO
};

const Roles = { roles, permissionsToName, roleToName };
export default Roles;
