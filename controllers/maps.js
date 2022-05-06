const { deleteFromMap, getMapId } = require('../util.js');
const { createCIDR, parse } = require('ip6addr');
const url = require('url');
/**
 * GET /maps/:name
 * Show map filtering to users domains
 */
exports.getMapHtml = async (req, res, next) => {
	let map,
		mapId,
		showValues = false;
	try {
		mapId = await getMapId(res.locals.haproxy, req.params.name);
		if (!mapId) {
			return res.status(400).send('invalid map');
		}
		map = await res.locals.haproxy
			.showMap(mapId.index);
	} catch (e) {
		return next(e);
	}

	switch (req.params.name) {
		case process.env.DDOS_MAP_NAME:
			showValues = true;
		case process.env.MAINTENANCE_MAP_NAME:
		case process.env.HOSTS_MAP_NAME:
			if (process.env.CUSTOM_BACKENDS_ENABLED) {
				showValues = true;
			}
			map = map.filter(a => {
				const [id, key, value] = a.split(' ');
				const { hostname, pathname } = url.parse(`https://${key}`);
				return res.locals.user.domains.includes(hostname);
			});
			break;
		case process.env.BLOCKED_MAP_NAME:
		case process.env.WHITELIST_MAP_NAME:
			map = map.filter(a => {
				const [id, key, value] = a.split(' ');
				return res.locals.user.username === value;
			});
			break;
		default:
			return res.status(400).send('invalid map');
	}

	res.render('map', {
		mapId,
		map,
		csrf: req.csrfToken(),
		name: req.params.name,
		showValues,
	});

};

/**
 * POST /maps/:name/delete
 * Delete the map entries of the body 'domain'
 */
exports.deleteMapForm = async (req, res, next) => {
	if(!req.body || !req.body.key || typeof req.body.key !== 'string' || req.body.key.length === 0) {
		res.status(400).send('invalid value');
	}

	if (req.params.name === process.env.HOSTS_MAP_NAME
		|| req.params.name === process.env.DDOS_MAP_NAME
		|| req.params.name === process.env.MAINTENANCE_MAP_NAME) {
		const { hostname } = url.parse(`https://${req.body.key}`);
		const allowed = res.locals.user.domains.includes(hostname);
		if (!allowed) {
			return res.status(403).send('no permission for that domain');
		}
	} else if (req.params.name === process.env.BLOCKED_MAP_NAME
		|| req.params.name === process.env.WHITELIST_MAP_NAME) {
		//permission check, see https://gitgud.io/fatchan/haproxy-panel/-/issues/10
	}

	try {

		if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.HOSTS_MAP_NAME) {
			//refactor -> getServer(hostname)
			const backendMapId = await getMapId(res.locals.haproxy, process.env.BACKENDS_MAP_NAME);
			const backendMapEntry = await res.locals.haproxy
				.showMap(backendMapId.index)
				.then(map => map.find(m => m.split(' ')[1] === req.body.key));
			if (backendMapEntry) {
				const serverName = backendMapEntry.split(' ')[2];
				const server = await res.locals.haproxy
					.backend(process.env.BACKEND_NAME)
					.then(backend => backend.server(serverName));
				await Promise.all([
					server.setState('disable'),
					//server.setAddress(),
					//server.setPort(),
					deleteFromMap(res.locals.haproxy, process.env.BACKENDS_MAP_NAME, req.body.key),
				]);
			} else {
				console.warn('no backend found to remove');
				//dont return because otherwise they will have a domain stuck in the hosts map
			}
		}

		await deleteFromMap(res.locals.haproxy, req.params.name, req.body.key);
		return res.redirect(`/maps/${req.params.name}`);
	} catch (e) {
		return next(e);
	}

};


/**
 * POST /maps/:name/add
 * Add map entries of the body 'domain'
 */
exports.patchMapForm = async (req, res, next) => {
	if(req.body && req.body.key && typeof req.body.key === 'string') {

		//ddos must have valid 0, 1, 2
		if (req.params.name === process.env.DDOS_MAP_NAME
			&& (!req.body.value || !['0', '1', '2'].includes(req.body.value))) {
			return res.status(400).send('invalid value');
		}

		//ddos and hosts must have valid hostname
		if (req.params.name === process.env.DDOS_MAP_NAME
			|| req.params.name === process.env.HOSTS_MAP_NAME
			|| req.params.name === process.env.MAINTENANCE_MAP_NAME) {
			const { hostname, pathname } = url.parse(`https://${req.body.key}`);
			const allowed = res.locals.user.domains.includes(hostname);
			if (!allowed) {
				return res.status(403).send('no permission for that domain');
			}
		}

		//validate key is valid ip address
		if (req.params.name === process.env.BLOCKED_MAP_NAME
			|| req.params.name === process.env.WHITELIST_MAP_NAME) {
			let parsedIp, parsedSubnet;
			try {
				parsedIp = parse(req.body.key);
			} catch (e) { parsedIp = null; /*invalid ip, or a subnet*/ }
			try {
				parsedSubnet = createCIDR(req.body.key);
			} catch (e) { parsedSubnet = null; /*invalid subnet or just an ip*/ }
			const parsedIpOrSubnet = parsedIp || parsedSubnet;
			if (!parsedIpOrSubnet) {
				return res.status(400).send('invalid input');
			}
			req.body.key = parsedIpOrSubnet.toString({zeroElide: false, zeroPad:false});
		}

		//validate value is IP:port
		if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.HOSTS_MAP_NAME) {
			let parsedValue;
			try {
				parsedValue = url.parse(`https://${req.body.value}`)
				if (!parsedValue.host || !parsedValue.port) {
					return res.status(400).send('invalid input');
				}
				parse(parsedValue.hostname); //better ip parsing, will error if invalid
			} catch (e) {
				return res.status(400).send('invalid input');
			}
			req.body.value = parsedValue.host; //host includes port
		}

		let value;
		switch (req.params.name) {
			case process.env.DDOS_MAP_NAME:
				value = req.body.value;
				break;
			case process.env.HOSTS_MAP_NAME:
				if (process.env.CUSTOM_BACKENDS_ENABLED) {
					value = req.body.value;
				} else {
					value = 0;
				}
				break;
			case process.env.BLOCKED_MAP_NAME:
			case process.env.WHITELIST_MAP_NAME:
			case process.env.MAINTENANCE_MAP_NAME:
				value = res.locals.user.username;
				break;
			default:
				return res.status(400).send('invalid map');
		}

		try {

			if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.HOSTS_MAP_NAME) {
				//refactor -> getServer(hostname)
				const backendMapId = await getMapId(res.locals.haproxy, process.env.BACKENDS_MAP_NAME);
				let backendMapSize;
				const backendMapEntry = await res.locals.haproxy
					.showMap(backendMapId.index)
					.then(map => {
						backendMapSize = map.length;
						return map.find(m => m.split(' ')[1] === req.body.key)
					});
				const backend = await res.locals.haproxy
					.backend(process.env.BACKEND_NAME);
				let server;
				if (backendMapEntry) {
					return res.status(400).send(`this domain is active already and has a backend server mapping: "${backendMapEntry}"`);
				} else {
					//no existing backend map entry (i.e. didnt exist at startup to get constructed in the lua script)
					let backendCounter = 0;
					let backendMapCheckId = 1;
					const maxServers = (await backend.servers()).length;
					if (backendMapSize > 0 && backendMapSize < maxServers) {
						//try and skip to an empty index for speed improvement.
						//will depend if any early servers are removed, but probably will be faster overall.
						backendMapCheckId = backendMapSize;
					}
					while (backendCounter < maxServers) {
						try {
							server = await backend.server(`${process.env.SERVER_PREFIX}${backendMapCheckId}`);
							const status = await server.status();
							if (status === 'MAINT') { //would atively used servers ever enter this state?
								break;
							}
						} catch (e) {
							server = null; //probably out of servers
						}
						backendMapCheckId = (backendMapCheckId+1) % maxServers;
						backendCounter++;
					}
					if (!server) {
						return res.status(400).send('no server slots available');
					}
					const backendsMapId = await getMapId(res.locals.haproxy, process.env.BACKENDS_MAP_NAME);
					await res.locals.haproxy
						.addMap(backendsMapId.index, req.body.key, server.name);
				}
				await server.setState('enable');
				await server.setAddress(value.split(':')[0]);
				await server.setPort(value.split(':')[1]);
			}

			const mapId = await getMapId(res.locals.haproxy, req.params.name);
			await res.locals.haproxy
				.addMap(mapId.index, req.body.key, value);
			return res.redirect(`/maps/${req.params.name}`);
		} catch (e) {
			return next(e);
		}
	}
	res.status(400).send('invalid value');
};
