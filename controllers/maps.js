
const { extractMap, dynamicResponse } = require('../util.js');
const { createCIDR, parse } = require('ip6addr');
const url = require('url');

/**
 * GET /maps/:name
 * Show map filtering to users domains
 */
exports.mapData = async (req, res, next) => {
	let map,
		mapInfo,
		showValues = false;
	try {
		mapInfo = await res.locals
			.dataPlane.getOneRuntimeMap(req.params.name)
			.then(res => res.data)
			.then(extractMap);
		if (!mapInfo) {
			return dynamicResponse(req, res, 400, { error: 'Invalid map' });
		}
		map = await res.locals
			.dataPlane.showRuntimeMap({
				map: req.params.name
			})
			.then(res => res.data);
	} catch (e) {
		return next(e);
	}

	switch (req.params.name) {
		case process.env.DDOS_MAP_NAME:
		case process.env.DDOS_CONFIG_MAP_NAME:
			map = map.map(a => {
				a.value = JSON.parse(a.value);
				return a;
			});
			/* falls through */
		case process.env.REWRITE_MAP_NAME:
		case process.env.REDIRECT_MAP_NAME:
			showValues = true;
			/* falls through */
		case process.env.BACKENDS_MAP_NAME:
		case process.env.HOSTS_MAP_NAME:
			if (process.env.CUSTOM_BACKENDS_ENABLED) {
				showValues = true;
			}
			/* falls through */
		case process.env.MAINTENANCE_MAP_NAME:
			map = map.filter(a => {
				const { hostname } = url.parse(`https://${a.key}`);
				return res.locals.user.domains.includes(hostname);
			});
			break;
		case process.env.BLOCKED_MAP_NAME:
		case process.env.WHITELIST_MAP_NAME:
			map = map.filter(a => {
				return res.locals.user.username === a.value;
			});
			break;
		default:
			return dynamicResponse(req, res, 400, { error: 'Invalid map' });
	}

	return {
		mapValueNames: { '0': 'None', '1': 'Proof-of-work', '2': 'Proof-of-work+Captcha' },
		mapInfo,
		map,
		csrf: req.csrfToken(),
		name: req.params.name,
		showValues,
	};
};

exports.mapPage = async (app, req, res, next) => {
	const data = await exports.mapData(req, res, next);
	return app.render(req, res, `/map/${data.name}`, data);
};

exports.mapJson = async (req, res, next) => {
	const data = await exports.mapData(req, res, next);
	return res.json({ ...data, user: res.locals.user });
};

/**
 * POST /maps/:name/delete
 * Delete the map entries of the body 'domain'
 */
exports.deleteMapForm = async (req, res, next) => {
	if(!req.body || !req.body.key || typeof req.body.key !== 'string' || req.body.key.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid value' });
	}

	if (req.params.name === process.env.HOSTS_MAP_NAME
		|| req.params.name === process.env.DDOS_MAP_NAME
		|| req.params.name === process.env.DDOS_CONFIG_MAP_NAME
		|| req.params.name === process.env.MAINTENANCE_MAP_NAME
		|| req.params.name === process.env.REDIRECT_MAP_NAME
		|| req.params.name === process.env.REWRITE_MAP_NAME) {
		const { hostname } = url.parse(`https://${req.body.key}`);
		const allowed = res.locals.user.domains.includes(hostname);
		if (!allowed) {
			return dynamicResponse(req, res, 403, { error: 'No permission for that domain' });
		}
	} else if (req.params.name === process.env.BLOCKED_MAP_NAME
		|| req.params.name === process.env.WHITELIST_MAP_NAME) {
		//TODO: permission check, see https://gitgud.io/fatchan/haproxy-panel/-/issues/10
	}

	try {

		if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.HOSTS_MAP_NAME) {
			const backendMapEntry = await res.locals
				.dataPlane.getRuntimeMapEntry({
					map: process.env.BACKENDS_MAP_NAME,
					id: req.body.key,
				})
				.then(res => res.data)
				.catch(() => {});
			if (backendMapEntry) {
				await res.locals
					.dataPlaneAll('deleteRuntimeServer', {
						backend: 'servers',
						name: backendMapEntry.value,
					});
				await res.locals
					.dataPlaneAll('deleteRuntimeMapEntry', {
						map: process.env.BACKENDS_MAP_NAME, //'backends'
						id: req.body.key, //'example.com'
					});
			} else {
				console.warn('no backend found to remove');
				//dont return because otherwise they will have a domain stuck in the hosts map
			}
		}

		await res.locals
			.dataPlaneAll('deleteRuntimeMapEntry', {
				map: req.params.name, //'ddos'
				id: req.body.key, //'example.com'
			});
		return dynamicResponse(req, res, 302, { redirect: `/map/${req.params.name}` });
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

		//validate key is domain
		if (req.params.name === process.env.DDOS_MAP_NAME
			|| req.params.name === process.env.DDOS_CONFIG_MAP_NAME
			|| req.params.name === process.env.HOSTS_MAP_NAME
			|| req.params.name === process.env.MAINTENANCE_MAP_NAME
			|| req.params.name === process.env.REDIRECT_MAP_NAME
			|| req.params.name === process.env.REWRITE_MAP_NAME) {
			const { hostname } = url.parse(`https://${req.body.key}`);
			const allowed = res.locals.user.domains.includes(hostname);
			if (!allowed) {
				return dynamicResponse(req, res, 403, { error: 'No permission for that domain' });
			}
		}

		//validate key is valid ip address
		if (req.params.name === process.env.BLOCKED_MAP_NAME
			|| req.params.name === process.env.WHITELIST_MAP_NAME) {
			let parsedIp, parsedSubnet;
			try {
				parsedIp = parse(req.body.key);
			} catch { parsedIp = null; /*invalid ip, or a subnet*/ }
			try {
				parsedSubnet = createCIDR(req.body.key);
			} catch { parsedSubnet = null; /*invalid subnet or just an ip*/ }
			const parsedIpOrSubnet = parsedIp || parsedSubnet;
			if (!parsedIpOrSubnet) {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
			req.body.key = parsedIpOrSubnet.toString({zeroElide: false, zeroPad:false});
		}

		//validate value is url (roughly)
		if (req.params.name === process.env.REWRITE_MAP_NAME
			|| req.params.name === process.env.REDIRECT_MAP_NAME) {
			try {
				new URL(`http://${req.body.value}`);
			} catch {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
		}

		//validate ddos_config
		if (req.params.name === process.env.DDOS_CONFIG_MAP_NAME) {
			const { pd, cex } = req.body;
			if ((pd && (isNaN(pd) || parseInt(pd) !== +pd || pd < 8))
				|| (cex && (isNaN(cex) || parseInt(cex) !== +cex))) {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
		}

		//validate ddos
		if (req.params.name === process.env.DDOS_MAP_NAME
			&& (!req.body.m || !['0', '1', '2'].includes(req.body.m))) {
			return dynamicResponse(req, res, 400, { error: 'Invalid value' });
		}
		if (req.params.name === process.env.DDOS_MAP_NAME) {
			const { m } = req.body; //t, v, etc
			if (m && (isNaN(m) || parseInt(m) !== +m || m < 0)) {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
		}

		//validate value is IP:port
		if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.HOSTS_MAP_NAME) {
			let parsedValue;
			try {
				parsedValue = url.parse(`https://${req.body.value}`)
				if (!parsedValue.host || !parsedValue.port) {
					return dynamicResponse(req, res, 400, { error: 'Invalid input' });
				}
				// parse(parsedValue.hostname); //better ip parsing, will error if invalid
			} catch {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
			req.body.value = parsedValue.host; //host includes port
		}

		let value;
		switch (req.params.name) {
			case process.env.REWRITE_MAP_NAME:
			case process.env.REDIRECT_MAP_NAME:
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
			case process.env.DDOS_MAP_NAME:
				value = JSON.stringify({
					m: parseInt(req.body.m || 1),
					t: req.body.t != null,
				});
				break;
			case process.env.DDOS_CONFIG_MAP_NAME:
				value = JSON.stringify({
					pd: parseInt(req.body.pd || 24),
					pt: req.body.pt === "argon2" ? "argon2" : "sha256",
					cex: parseInt(req.body.cex || 21600),
					cip: req.body.cip ? true : false,
				});
				break;
			default:
				return dynamicResponse(req, res, 400, { error: 'Invalid map' });
		}

		try {

			if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.HOSTS_MAP_NAME) {
				const backendMapEntry = await res.locals
					.dataPlane.getRuntimeMapEntry({
						map: process.env.BACKENDS_MAP_NAME,
						id: req.body.key,
					})
					.then(res => res.data)
					.catch(() => {});
				const freeSlotId = await res.locals.dataPlane
					.getRuntimeServers({
						backend: 'servers'
					})
					.then(res => res.data)
					.then(servers => {
						if (servers.length > 0) {
							const serverIds = servers
								.map(s => parseInt(s.id))
								.sort((a, b) => a-b);
							const serverNameIds = servers
								.map(s => parseInt(s.name.substr(6)))
								.sort((a, b) => a-b);
							return Math.max(serverIds[serverIds.length-1], serverNameIds[serverNameIds.length-1])+1;
						}
						return 1;
					});
				if (!freeSlotId) {
					return dynamicResponse(req, res, 400, { error: 'No server slots available' });
				}
				const { hostname: address, port } = new URL(`http://${value}`);
				const runtimeServerResp = await res.locals
					.dataPlaneAll('addRuntimeServer', {
						backend: 'servers',
					}, {
						address,
						port: parseInt(port),
						name: `websrv${freeSlotId}`,
						id: `${freeSlotId}`,
						ssl: 'enabled',
						verify: 'none',
					});
				console.log('added runtime server', req.body.key, runtimeServerResp.data);
				if (backendMapEntry) {
					console.info('Setting multiple domain->ip entries for', req.body.key, backendMapEntry)
					await res.locals
						.dataPlaneAll('replaceRuntimeMapEntry', {
							map: process.env.BACKENDS_MAP_NAME,
							id: req.body.key,
						}, {
							value: `${backendMapEntry.value},websrv${freeSlotId}`,
						});
				} else {
					await res.locals
						.dataPlaneAll('addPayloadRuntimeMap', {
							name: process.env.BACKENDS_MAP_NAME,
						}, [{
							key: req.body.key,
							value: `websrv${freeSlotId}`,
						}]);
				}
			}

			const existingEntry = req.params.name === process.env.HOSTS_MAP_NAME
				? null
				: (await res.locals
				.dataPlane.getRuntimeMapEntry({
					map: req.params.name,
					id: req.body.key,
				})
				.then(res => res.data)
				.catch(() => {}));
			if (existingEntry) {
				await res.locals
					.dataPlaneAll('replaceRuntimeMapEntry', {
						map: req.params.name,
						id: req.body.key,
					}, {
						value: value,
					});
			} else {
				await res.locals
					.dataPlaneAll('addPayloadRuntimeMap', {
						name: req.params.name
					}, [{
						key: req.body.key,
						value: value,
					}]);
			}
			return dynamicResponse(req, res, 302, { redirect: req.body.onboarding ? '/onboarding' : `/map/${req.params.name}` });
		} catch (e) {
			return next(e);
		}
	}
	return dynamicResponse(req, res, 400, { error: 'Invalid value' });
};
