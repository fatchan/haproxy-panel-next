export const Permissions = Object.seal(Object.freeze(Object.preventExtensions({

	//TODO: root perm

	BILLING: 1,

	MANAGE_API_KEYS: 10,

	MANAGE_DNS: 20,

	MANAGE_BACKENDS: 30,

	MANAGE_CERTS: 40,

	MANAGE_PROTECTION: 50,

	MANAGE_EDGERULES: 60,

	MANAGE_CACHE: 70,

	MANAGE_STATS: 80,

	MANAGE_STREAMING: 90,

	_ORG_BITS: [1],

})));

export const Metadata = Object.seal(Object.freeze(Object.preventExtensions({

	[Permissions.BILLING]: { label: 'Billing', description: 'Access billing' },
	// TODO: parents: [Permissions.ROOT] }, etc

	[Permissions.MANAGE_API_KEYS]: { label: 'API Keys', description: 'Manage API keys' },

	[Permissions.MANAGE_DNS]: { label: 'DNS', description: 'Manage DNS and domains' },

	[Permissions.MANAGE_BACKENDS]: { label: 'Backends', description: 'Manage backend IPs and settings' },

	[Permissions.MANAGE_CERTS]: { label: 'Certificates', description: 'Manage HTTPS certificates and CSR verification' },

	[Permissions.MANAGE_PROTECTION]: { label: 'Protection', description: 'Manage protection rules and settings' },

	[Permissions.MANAGE_EDGERULES]: { label: 'Edge Rules', description: 'Manage edge rules and customization' },

	[Permissions.MANAGE_CACHE]: { label: 'Cache', description: 'Perform cache purges' },

	[Permissions.MANAGE_STATS]: { label: 'Stats', description: 'View statistics' },

	[Permissions.MANAGE_STREAMING]: { label: 'Streaming', description: 'Manage streaming' },

})));
