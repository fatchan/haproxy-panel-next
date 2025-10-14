export const Permissions = Object.seal(Object.freeze(Object.preventExtensions({

	//TODO: root perm

	BILLING: 1,

	//TODO: api keys perms (and crud for api keys)

	//TODO: crud dns

	//TODO: crud backends

	//TODO: crud certs

	//TODO: crud protection

	//TODO: crud edge rules/customisation

	//TODO: cache

	//TODO: stats

	//TODO: crud

	_ORG_BITS: [1],

})));

export const Metadata = Object.seal(Object.freeze(Object.preventExtensions({

	[Permissions.BILLING]: { label: 'Billing', description: 'Access billing' }

	// TODO: parents: [Permissions.ROOT] }, etc

})));
