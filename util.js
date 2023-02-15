const url = require('url');

const fMap = {

	[process.env.HOSTS_MAP_NAME]: {
		fname: 'Active Domains',
		description: 'Domains that will be processed by the selected cluster',
		columnNames: ['Domain', 'Backend'],
	},

	[process.env.DDOS_MAP_NAME]: {
		fname: 'Protection Rules',
		description: 'Rules for protection mode on domains and/or paths',
		columnNames: ['Domain/Path', 'Mode'],
	},

	[process.env.BLOCKED_MAP_NAME]: {
		fname: 'Blocked IPs/Subnets',
		description: 'IPs/subnets that are outright blocked',
		columnNames: ['IP/Subnet', ''],
	},

	[process.env.WHITELIST_MAP_NAME]: {
		fname: 'Whitelisted IPs/Subnets',
		description: 'IPs/subnets that bypass protection rules',
		columnNames: ['IP/Subnet', ''],
	},

	[process.env.MAINTENANCE_MAP_NAME]: {
		fname: 'Maintenance Mode',
		description: 'Disable proxying and show maintenance page for selected domains',
		columnNames: ['Domain', ''],
	},

	[process.env.BACKENDS_MAP_NAME]: {
		fname: 'Domain Backend Mappings',
		description: 'Which internal server haproxy uses for domains',
		columnNames: ['Domain', 'Server Name'],
	},

};

module.exports = {

	fMap,

	makeArrayIfSingle: (obj) => !Array.isArray(obj) ? [obj] : obj,

	validClustersString: (string) => {
		return !string.split(',').some(c => {
			const cUrl = url.parse(c);
			return (cUrl.protocol !== 'tcp:' || !cUrl.hostname)
		});
	},

	extractMap: (item) => {
		const name = item.file && item.file.match(/\/etc\/haproxy\/map\/(?<name>.+).map/).groups.name;
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

};
