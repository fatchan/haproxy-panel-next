import Permission from './permission.js';
import { Permissions } from './permissions.js';

//temp until bootstrapping and customisable base roles
const ORG_OWNER = (() => {
  const p = new Permission();
  p.set(Permissions.BILLING);
  return p;
})();

const roles = {
  ANON: new Permission(), // no permissions
  ORG_MEMBER: new Permission(), //TODO: org member perms once there is more differentiation than just billing
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

export default { roles, permissionsToName, roleToName };
