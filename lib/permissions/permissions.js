export const Permissions = Object.seal(Object.freeze(Object.preventExtensions({

	ROOT: 0,
	//TODO: account perms (not confused w capabilities)

	ORG_OWNER: 9,
	MANAGE_ORG: 10,

	MANAGE_BILLING: 20,

	MANAGE_API_KEYS: 30,

	MANAGE_DNS: 40,

	MANAGE_BACKENDS: 50,

	MANAGE_CERTS: 60,

	MANAGE_MAPS: 70,

	MANAGE_CACHE: 90,

	MANAGE_STATS: 100,

	MANAGE_STREAMING: 110,

	_ORG_BITS: [9, 10, 20, 30, 40, 50, 60, 70, 90, 100, 110],

})));

export const Metadata = Object.seal(Object.freeze(Object.preventExtensions({

	[Permissions.ROOT]: { label: 'Root', description: 'Full access', parents: [Permissions.ROOT] },

	[Permissions.ORG_OWNER]: { label: 'Organisation Owner', description: 'Organisation owner', parents: [Permissions.ORG_OWNER] },
	[Permissions.MANAGE_ORG]: { label: 'Organisation', description: 'Manage organisation members & permissions', parents: [Permissions.ORG_OWNER] },

	[Permissions.MANAGE_BILLING]: { label: 'Billing', description: 'Access billing', parents: [Permissions.ORG_OWNER] },

	[Permissions.MANAGE_API_KEYS]: { label: 'API Keys', description: 'Manage API keys', parents: [Permissions.ORG_OWNER] },

	[Permissions.MANAGE_DNS]: { label: 'DNS', description: 'Manage DNS and domains', parents: [Permissions.MANAGE_ORG] },

	[Permissions.MANAGE_BACKENDS]: { label: 'Backends', description: 'Manage backend IPs and settings', parents: [Permissions.MANAGE_ORG] },

	[Permissions.MANAGE_CERTS]: { label: 'Certificates', description: 'Manage HTTPS certificates and CSR verification', parents: [Permissions.MANAGE_ORG] },

	[Permissions.MANAGE_MAPS]: { label: 'Maps', description: 'Manage maps (protection rules and settings, edge rules, and customisation)', parents: [Permissions.MANAGE_ORG] },

	[Permissions.MANAGE_CACHE]: { label: 'Cache', description: 'Perform cache purges', parents: [Permissions.MANAGE_ORG] },

	[Permissions.MANAGE_STATS]: { label: 'Stats', description: 'View statistics', parents: [Permissions.MANAGE_ORG] },

	[Permissions.MANAGE_STREAMING]: { label: 'Streaming', description: 'Manage streaming', parents: [Permissions.MANAGE_ORG] },

})));
