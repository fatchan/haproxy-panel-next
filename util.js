const url = require('url');

const fMap = {

	[process.env.HOSTS_MAP_NAME]: {
		fname: 'Backends',
		description: 'Backend IP mappings for domains',
		columnNames: ['Domain', 'Backend'],
	},

	[process.env.DDOS_MAP_NAME]: {
		fname: 'Protection Rules',
		description: 'Set protection modes on domains and/or paths',
		columnNames: ['Domain/Path', 'Mode', 'Tor Exits Only'],
		columnKeys: ['m', 't'],
	},

	[process.env.DDOS_CONFIG_MAP_NAME]: {
		fname: 'Protection Settings',
		description: 'Customise protection settings on a per-domain basis',
		columnNames: ['Domain/Path', 'Difficulty', 'POW Type', 'Expiry', 'Lock cookie to IP'],
		columnKeys: ['pd', 'pt', 'cex', 'cip'],
	},

	[process.env.BLOCKED_MAP_NAME]: {
		fname: 'IP Blacklist',
		description: 'IPs/subnets that are outright blocked',
		columnNames: ['IP/Subnet', ''],
	},

	[process.env.WHITELIST_MAP_NAME]: {
		fname: 'IP Whitelist',
		description: 'IPs/subnets that bypass protection rules',
		columnNames: ['IP/Subnet', ''],
	},

	[process.env.MAINTENANCE_MAP_NAME]: {
		fname: 'Maintenance Mode',
		description: 'Disable proxying and show maintenance page for selected domains',
		columnNames: ['Domain', ''],
	},

	[process.env.REWRITE_MAP_NAME]: {
		fname: 'Rewrites',
		description: 'Rewrite domain to a different domain and/or path',
		columnNames: ['Domain', 'Rewrite to'],
	},

	[process.env.REDIRECT_MAP_NAME]: {
		fname: 'Redirects',
		description: 'Redirect one domain to another, stripping path',
		columnNames: ['Domain', 'Redirect to'],
	},

//	[process.env.BACKENDS_MAP_NAME]: {
//		fname: 'Domain Backend Mappings',
//		description: 'Which internal server haproxy uses for domains',
//		columnNames: ['Domain', 'Server Name'],
//	},

};

module.exports = {

	fMap,

	makeArrayIfSingle: (obj) => !Array.isArray(obj) ? [obj] : obj,

	validClustersString: (string) => {
		return !string.split(',').some(c => {
			const cUrl = url.parse(c);
			return (cUrl.protocol !== 'http:' || !cUrl.hostname)
		});
	},

	extractMap: (item) => {
		const name = item.file && item.file.match(/\/etc\/haproxy\/map\/(?<name>.+).map/).groups.name;
		if (!fMap[name]) { return null; }
		const count = item.description && item.description.match(/(?:.+entry_cnt=(?<count>\d+)$)?/).groups.count;
		return {
			name,
			count,
			id: item.id,
			...fMap[name],
		};
	},

	dynamicResponse: (req, res, code, data) => {
		const isRedirect = code === 302;
		if (req.headers && req.headers['content-type'] === 'application/json') {
			return res
				.status(isRedirect ? 200 : code)
				.json(data);
		}
		if (isRedirect) {
			return res.redirect(data.redirect);
		}
		//TODO: pass through app (bind to middleware) and app.render an "error" page for nojs users?
		return res.status(code).send(data);
	},

	wildcardCheck: (subject, allowedDomains) => {
		if (subject.includes('\\')) { throw new Error('Illegal wildcardCheck'); }
		const wcRegex = new RegExp(subject.replace(/\*/g, "[^ ]*\\")+'$');
		return allowedDomains.some(d => {
			return wcRegex.test(d);
		});
	}

};
