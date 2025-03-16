import { extractMap, dynamicResponse, metaMapMapping, fMap } from '../util.js';
import { createCIDR, parse } from 'ip6addr';
import * as db from '../db.js';
import url from 'url';
import countries from 'i18n-iso-countries';
const countryMap = countries.getAlpha2Codes();
import { continentMap } from '../lib/misc/continents.js';

export async function backendIpAllowed(dataPlaneRetry, username, backendIp) {

	const hostsMap = await dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_HOSTS_MAP_NAME })
		.then(res => res.data)
		.then(res => {
			return res.map(e => {
				//TODO: handle ipv6 backend (not supported yet anyway)
				const [ipAndPort, geo] = e.value.split('|');
				const [splitIp, _] = ipAndPort.split(':');
				const parsedIp = parse(splitIp).toString({ zeroElide: false, zeroPad: false }); // prevent bypass with compressed addresses
				return {
					ip: parsedIp, //parsed ip
					domain: e.key, //domain
					geo: geo, //geo routing region (cn)
				};
			});
		});
	const existingEntry = hostsMap.find(e => e.ip === backendIp);
	if (existingEntry) {
		//theres already another backend with this IP, check domtoacc mapping
		const backendMapEntry = await dataPlaneRetry('getRuntimeMapEntry', {
			map: process.env.NEXT_PUBLIC_DOMTOACC_MAP_NAME,
			id: existingEntry.domain,
		})
			.then(res => res.data);
		if (backendMapEntry) {
			return backendMapEntry.value === username; //Return true if this user already owns this backend IP
		}
	}

	return true; //No existing entry, fresh ip

}

/**
 * GET /maps/:name
 * Show map filtering to users domains
 */
export async function mapData(req, res, next) {
	let map,
		mapInfo,
		showValues = false,
		mapNotes = {};
	const mapName = metaMapMapping[req.params.name] || req.params.name;
	try {
		mapNotes = await db.db().collection('mapnotes').find({
			username: res.locals.user.username,
			map: mapName
		}).toArray();
		mapNotes = mapNotes.reduce((acc, note) => {
			acc[note.key] = note.note;
			return acc;
		}, {});
		mapInfo = await res.locals
			.dataPlaneRetry('getOneRuntimeMap', mapName)
			.then(res => res.data)
			.then(extractMap);
		if (!mapInfo) {
			return dynamicResponse(req, res, 400, { error: 'Invalid map' });
		}
		map = await res.locals
			.dataPlaneRetry('showRuntimeMap', {
				map: mapName
			})
			.then(res => res.data);
	} catch (e) {
		console.error(e);
		return next(e);
	}

	switch (req.params.name) {
		case process.env.NEXT_PUBLIC_DDOS_MAP_NAME:
		case process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME:
			map = map.map(a => {
				try {
					a.value = JSON.parse(a.value);
				} catch (e) {
					console.warn('Failed to parse map value', a.value);
					return undefined;
				}
				return a;
			}).filter(x => x);
		/* falls through */
		case process.env.NEXT_PUBLIC_CSS_MAP_NAME:
			if (req.params.name === process.env.NEXT_PUBLIC_CSS_MAP_NAME) {
				map = map.map(a => {
					try {
						a.value = decodeURIComponent(a.value);
					} catch (e) {
						console.warn('Failed to parse map value', a.value);
						return undefined;
					}
					return a;
				}).filter(x => x);
			}
		/* falls through */
		case process.env.NEXT_PUBLIC_REWRITE_MAP_NAME:
		case process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME:
		case process.env.NEXT_PUBLIC_IMAGES_MAP_NAME:
			const isImages = req.params.name === process.env.NEXT_PUBLIC_IMAGES_MAP_NAME;
			map = map.filter(a => {
				const { pathname } = url.parse(`https://${a.key}`);
				const isPowIconPath = pathname === `/${process.env.NEXT_PUBLIC_DOT_PATH}/pow-icon`;
				return isImages ? isPowIconPath : !isPowIconPath;
			});
			if (isImages) {
				map = map.map(a => {
					return {
						...a,
						key: new URL(`http://${a.key}`).hostname,
						value: {
							image: 'bot-check', //TODO: make dynamic once other image types are supported
							value: a.value,
						}
					};
				});
				mapInfo = {
					...mapInfo,
					...fMap[req.params.name],
				};
			}
			showValues = true;
		/* falls through */
		case process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME:
		case process.env.NEXT_PUBLIC_HOSTS_MAP_NAME:
			if (process.env.CUSTOM_BACKENDS_ENABLED) {
				showValues = true;
			}
			const isHosts = req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME;
			if (isHosts) {
				map = map.map(a => {
					const [ipAndPort, geo] = a.value.split('|');
					return {
						...a,
						value: {
							ip: ipAndPort,
							geo: geo,
						}
					};
				});
			}
		/* falls through */
		case process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME:
			map = map.filter(a => {
				const { hostname } = url.parse(`https://${a.key}`);
				return res.locals.user.domains.includes(hostname);
			});
			break;
		case process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME:
		case process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME:
		case process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME:
		case process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME:
		case process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME:
			map = map
				.filter(a => {
					return a.value && a.value.split(':').includes(res.locals.user.username);
				})
				.map(x => {
					x.value = res.locals.user.username;
					return x;
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
		mapNotes,
	};
}

export async function mapPage(app, req, res, next) {
	const data = await mapData(req, res, next);
	res.locals.data = { ...data, user: res.locals.user };
	return app.render(req, res, `/map/${data.name}`);
}

export async function mapJson(req, res, next) {
	const data = await mapData(req, res, next);
	return res.json({ ...data, user: res.locals.user });
}

/**
 * POST /maps/:name/delete
 * Delete the map entries of the body 'domain'
 */
export async function deleteMapForm(req, res, next) {
	if (!req.body || !req.body.key || typeof req.body.key !== 'string' || req.body.key.length === 0) {
		return dynamicResponse(req, res, 400, { error: 'Invalid value' });
	}
	if (req.body && req.body.note && (typeof req.body.note !== 'string' || req.body.note.length > 200)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid note' });
	}
	const mapName = metaMapMapping[req.params.name] || req.params.name;
	if (req.params.name === process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME) {
		let value;
		const existingEntries = await res.locals
			.dataPlaneRetry('showRuntimeMap', {
				map: req.params.name,
				// id: req.body.key,
			})
			.then((res) => res.data)
			.catch(() => { });
		const existingEntry = existingEntries && existingEntries
			.find(en => en.key === req.body.key);
		console.log('existingEntry', existingEntry);
		if (existingEntry && existingEntry.value) {
			let existingEntries = existingEntry.value.split(':');
			if (!existingEntries || !existingEntries.includes(res.locals.user.username)) {
				return dynamicResponse(req, res, 403, { error: 'No permission to remove that entry' });
			}
			existingEntries = existingEntries.filter(e => e !== res.locals.user.username);
			value = existingEntries.join(':'); //0 length if was only name
			try {
				if (value && value.length > 0) {
					//if value still exists, other user has whitelisted, so replace withg updated value
					await res.locals
						.dataPlaneAll('replaceRuntimeMapEntry', {
							map: req.params.name,
							id: req.body.key,
						}, {
							value: value,
						}, null, false, false);
				} else {
					//else we were the last/only one, so remove
					await res.locals
						.dataPlaneAll('deleteRuntimeMapEntry', {
							map: req.params.name,
							id: req.body.key,
						}, null, null, false, false);
				}
			} catch (e) {
				return next(e);
			}
		}
	} else if (req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_DDOS_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_REWRITE_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_IMAGES_MAP_NAME
		|| req.params.name === process.env.NEXT_PUBLIC_CSS_MAP_NAME) {
		const { hostname } = url.parse(`https://${req.body.key}`);
		const allowed = res.locals.user.domains.includes(hostname);
		if (!allowed) {
			return dynamicResponse(req, res, 403, { error: 'No permission for that domain' });
		}
		//TODO: handle for other image types and make dynamic for e.g. css, translations map(s)
		if (req.params.name === process.env.NEXT_PUBLIC_IMAGES_MAP_NAME) {
			//tood: handle for images other than bot-check
			req.body.key = `${hostname}/${process.env.NEXT_PUBLIC_DOT_PATH}/pow-icon`;
		}
		try {
			if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME) {
				//Make sure to also update backends map if editing hosts map and putting duplicate
				const matchingBackend = await res.locals
					.dataPlaneRetry('showRuntimeMap', {
						map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
					})
					.then((res) => res.data)
					.then(backends => backends.find(mb => mb.key === req.body.key));
				console.log('matchingBackend', matchingBackend);
				if (!matchingBackend) {
					return dynamicResponse(req, res, 400, { error: 'Invalid backend state, please contact support' });
				}
				const splitValue = matchingBackend.value.split(',');
				//NOTE: deletes all backends (for now, requires enhancement to match between hosts map and backends map
				await Promise.all([
					await Promise.all(splitValue.map(bsv =>
						res.locals
							.dataPlaneAll('deleteRuntimeServer', {
								backend: 'servers',
								name: bsv.substring(0, bsv.length - 3), // strip geo code
							}, null, null, false, true)
					)),
					res.locals
						.dataPlaneAll('deleteRuntimeMapEntry', {
							map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
							id: matchingBackend.key, // id of (possibly multi host) single row backend
						}, null, null, false, true)
				]);
			}
			await res.locals
				.dataPlaneAll('deleteRuntimeMapEntry', {
					map: mapName, //'ddos'
					id: req.body.key, //'example.com'
				}, null, null, false, false);
		} catch (e) {
			return next(e);
		}
	}
	await db.db().collection('mapnotes').deleteMany({
		username: res.locals.user.username,
		map: req.params.name,
		key: req.body.key,
	});
	return dynamicResponse(req, res, 302, { redirect: `/map/${req.params.name}` });
}

/**
 * POST /maps/:name/add
 * Add map entries of the body 'domain'
 */
export async function patchMapForm(req, res, next) {
	if (req.body && req.body.key && typeof req.body.key === 'string') {

		const mapName = metaMapMapping[req.params.name] || req.params.name;

		//validate key is domain
		if (req.params.name === process.env.NEXT_PUBLIC_DDOS_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_REWRITE_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_IMAGES_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_CSS_MAP_NAME) {
			const { hostname } = url.parse(`https://${req.body.key}`);
			const allowed = res.locals.user.domains.includes(hostname);
			if (!allowed) {
				return dynamicResponse(req, res, 403, { error: 'No permission for that domain' });
			}
		}

		if (req.params.name === process.env.NEXT_PUBLIC_CSS_MAP_NAME
			&& (!req.body || !req.body.value || typeof req.body.value !== 'string')) {
			return dynamicResponse(req, res, 400, { error: 'Invalid input' });
		}

		if (req.params.name === process.env.NEXT_PUBLIC_IMAGES_MAP_NAME) {
			//TODO: update once more image types are available, refactor mapping to reuse logic in delete map endpoint
			if (req.body.image !== 'bot-check') {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
			const { hostname } = url.parse(`https://${req.body.key}`);
			req.body.key = `${hostname}/${process.env.NEXT_PUBLIC_DOT_PATH}/pow-icon`;
		}

		//validate key is valid ip address
		if (req.params.name === process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME) {
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
			req.body.key = parsedIpOrSubnet.toString({ zeroElide: false, zeroPad: false });
		}

		//validate key is ASN
		if (req.params.name === process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME) {
			if (!/^\d+$/.test(req.body.key)) {
				return dynamicResponse(req, res, 403, { error: 'Invalid ASN' });
			}
			//req.body.key is a number
		}

		//validate key is country code
		if (req.params.name === process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME) {
			if (!countryMap[req.body.key]) {
				return dynamicResponse(req, res, 403, { error: 'Invalid country code' });
			}
			//req.body.key is a cc
		}

		//validate key is country code
		if (req.params.name === process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME) {
			if (!continentMap[req.body.key] || req.body.key === 'XX') { //XX only for hosts map for now
				return dynamicResponse(req, res, 403, { error: 'Invalid continent code' });
			}
			//req.body.key is a cn
		}

		//validate value is url (roughly)
		if (req.params.name === process.env.NEXT_PUBLIC_REWRITE_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME
			|| req.params.name === process.env.NEXT_PUBLIC_IMAGES_MAP_NAME) {
			try {
				new URL(`http://${req.body.value}`);
			} catch {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
		}

		//validate ddos_config
		if (req.params.name === process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME) {
			const { pd, cex } = req.body;
			if ((pd && (isNaN(pd) || parseInt(pd, 10) !== +pd || pd < 8))
				|| (cex && (isNaN(cex) || parseInt(cex, 10) !== +cex))) {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
		}

		//validate ddos
		if (req.params.name === process.env.NEXT_PUBLIC_DDOS_MAP_NAME
			&& (!req.body.m || !['0', '1', '2'].includes(req.body.m.toString()))) {
			return dynamicResponse(req, res, 400, { error: 'Invalid value' });
		}
		if (req.params.name === process.env.NEXT_PUBLIC_DDOS_MAP_NAME) {
			const { m } = req.body; //t, v, etc
			if (m && (isNaN(m) || parseInt(m, 10) !== +m || m < 0)) {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
		}

		//validate value is IP:port
		if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME) {
			//validate key is country code
			if (!req.body.geo || typeof req.body.geo !== 'string' || !continentMap[req.body.geo]) {
				return dynamicResponse(req, res, 403, { error: 'Invalid backend geo route value' });
			}
			let parsedValue;
			try {
				parsedValue = url.parse(`https://${req.body.ip}`);
				if (!parsedValue.host || !parsedValue.port) {
					return dynamicResponse(req, res, 400, { error: 'Invalid input' });
				}
				// parse(parsedValue.hostname); //better ip parsing, will error if invalid
			} catch {
				return dynamicResponse(req, res, 400, { error: 'Invalid input' });
			}
			req.body.ip = parsedValue.host; //host includes port
		}

		let value;
		switch (req.params.name) {
			case process.env.NEXT_PUBLIC_REWRITE_MAP_NAME:
			case process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME:
			case process.env.NEXT_PUBLIC_IMAGES_MAP_NAME:
				value = req.body.value;
				break;
			case process.env.NEXT_PUBLIC_HOSTS_MAP_NAME:
				if (process.env.CUSTOM_BACKENDS_ENABLED) {
					value = `${req.body.ip}|${req.body.geo}`;
				} else {
					value = 0;
				}
				break;
			case process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME:
			case process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME:
			case process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME:
			case process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME:
			case process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME: {
				const existingEntry = await res.locals
					.dataPlaneRetry('getRuntimeMapEntry', {
						map: req.params.name,
						id: req.body.key,
					})
					.then((res) => res.data)
					.catch(() => { });
				if (existingEntry && existingEntry.value) {
					const existingSplitEntries = existingEntry.value.split(':');
					existingSplitEntries.push(res.locals.user.username);
					const dedupedSplitEntries = [...new Set(existingSplitEntries)];
					value = dedupedSplitEntries.join(':');
				} else {
					value = res.locals.user.username;
				}
				break;
			}
			case process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME:
				value = res.locals.user.username;
				break;
			case process.env.NEXT_PUBLIC_DDOS_MAP_NAME:
				value = JSON.stringify({
					m: parseInt(req.body.m || 1, 10),
					t: req.body.t === true ? true : false,
				});
				break;
			case process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME:
				value = JSON.stringify({
					pd: parseInt(req.body.pd || 24, 10),
					pt: req.body.pt === 'argon2' ? 'argon2' : 'sha256',
					cex: parseInt(req.body.cex || 21600, 10),
					cip: req.body.cip === true ? true : false,
					js: req.body.js !== true ? false : true, //inverted to help w existing default
				});
				break;
			case process.env.NEXT_PUBLIC_CSS_MAP_NAME:
				value = encodeURIComponent(req.body.value);
				console.log('value', value);
				break;
			default:
				return dynamicResponse(req, res, 400, { error: 'Invalid map' });
		}

		try {

			if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME) {
				const { hostname: address, port } = new URL(`http://${req.body.ip}`);
				const backendAllowed = await backendIpAllowed(res.locals.dataPlaneRetry, res.locals.user.username, address);
				if (!backendAllowed) {
					return dynamicResponse(req, res, 403, { error: 'No permission to add a backend with that IP' });
				}
				const backendMapEntry = await res.locals
					.dataPlaneRetry('getRuntimeMapEntry', {
						map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
						id: req.body.key,
					})
					.then(res => res.data)
					.catch(() => { });
				const freeSlotId = await res.locals
					.dataPlaneRetry('getRuntimeServers', {
						backend: 'servers'
					})
					.then(res => res.data)
					.then(servers => {
						if (servers.length > 0) {
							const serverIds = servers
								.map(s => parseInt(s.id, 10))
								.sort((a, b) => a - b);
							const serverNameIds = servers
								.map(s => parseInt(s.name.substr(6), 10))
								.sort((a, b) => a - b);
							return Math.max(serverIds[serverIds.length - 1], serverNameIds[serverNameIds.length - 1]) + 1;
						}
						return 1;
					});
				if (!freeSlotId) {
					return dynamicResponse(req, res, 400, { error: 'No server slots available' });
				}
				const serverName = `websrv${freeSlotId}`;
				const runtimeServerResp = await res.locals
					.dataPlaneAll('addRuntimeServer', {
						backend: 'servers',
					}, {
						address,
						port: parseInt(port, 10),
						name: serverName,
						// id: `${freeSlotId}`,
						// ssl_cafile: '/usr/local/share/ca-certificates/dev-priv-ca/ca-cert.pem',
						// ssl_cafile: '@system-ca',
						ssl_cafile: 'ca-certificates.crt',
						sni: 'req.hdr(Host)',
						ssl_reuse: 'enabled',
						ssl: 'enabled',
						verify: process.env.ALLOW_SELF_SIGNED_SSL === 'true' ? 'none' : 'required',
					}, null, false, true);
				console.log('added runtime server', req.body.key, runtimeServerResp.data);
				await res.locals
					.dataPlaneAll('replaceRuntimeServer', {
						name: serverName,
						backend: 'servers',
					}, {
						admin_state: 'ready',
						operational_state: 'up',
					}, null, false, true);
				if (backendMapEntry) {
					console.info('Setting multiple domain->ip entries for', req.body.key, backendMapEntry);
					// Have to show the whole map because getRuntimeMapEntry will only have first value (why? beats me)
					const fullBackendMap = await res.locals
						.dataPlaneRetry('showRuntimeMap', {
							map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME
						})
						.then(res => res.data);
					const fullBackendMapEntry = fullBackendMap
						.find(entry => entry.key === req.body.key); //Find is OK because there shouldn't be duplicate keys
					await res.locals
						.dataPlaneAll('replaceRuntimeMapEntry', {
							map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
							id: req.body.key,
						}, {
							value: `${fullBackendMapEntry.value},websrv${freeSlotId}|${req.body.geo}`,
						}, null, false, false);
				} else {
					await res.locals
						.dataPlaneAll('addPayloadRuntimeMap', {
							name: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
						}, [{
							key: req.body.key,
							value: `websrv${freeSlotId}|${req.body.geo}`,
						}], null, false, false);
				}
			}

			const existingEntry = mapName === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME
				? null
				: (await res.locals
					.dataPlaneRetry('getRuntimeMapEntry', {
						map: mapName,
						id: req.body.key,
					})
					.then(res => res.data)
					.catch(() => { }));
			if (existingEntry) {
				await res.locals
					.dataPlaneAll('replaceRuntimeMapEntry', {
						map: mapName,
						id: req.body.key,
					}, {
						value: value,
					}, null, false, false);
			} else {
				await res.locals
					.dataPlaneAll('addPayloadRuntimeMap', {
						name: mapName
					}, [{
						key: req.body.key,
						value: value,
					}], null, null, false);
			}
			await db.db().collection('mapnotes').replaceOne({
				username: res.locals.user.username,
				map: mapName,
				key: req.body.key,
			}, {
				username: res.locals.user.username,
				map: mapName,
				key: req.body.key,
				note: req.body.note,
			}, {
				upsert: true,
			});
			if (req.body.edit) {
				return dynamicResponse(req, res, 200, {});
			}
			return dynamicResponse(req, res, 302, { redirect: req.body.onboarding ? '/onboarding' : `/map/${req.params.name}` });
		} catch (e) {
			return next(e);
		}
	}
	return dynamicResponse(req, res, 400, { error: 'Invalid value' });
}
