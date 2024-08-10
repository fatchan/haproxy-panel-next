import { extractMap, dynamicResponse } from '../util.js';
import { createCIDR, parse } from 'ip6addr';
import * as db from '../db.js';
import url from 'url';
import countries from 'i18n-iso-countries';
const countryMap = countries.getAlpha2Codes();
const continentMap = {
	'NA': 'North America',
	'SA': 'South America',
	'EU': 'Europe',
	'AS': 'Asia',
	'OC': 'Oceania',
	'AF': 'Africa',
	'AN': 'Antarctica',
};
/**
 * GET /maps/:name
 * Show map filtering to users domains
 */
export async function mapData(req, res, next) {
	let map,
		mapInfo,
		showValues = false,
		mapNotes = {};
	try {
		mapNotes = await db.db().collection('mapnotes').find({
			username: res.locals.user.username,
			map: req.params.name
		}).toArray();
		mapNotes = mapNotes.reduce((acc, note) => {
			acc[note.key] = note.note;
			return acc;
		}, {});
		mapInfo = await res.locals
			.dataPlaneRetry('getOneRuntimeMap', req.params.name)
			.then(res => res.data)
			.then(extractMap);
		if (!mapInfo) {
			return dynamicResponse(req, res, 400, { error: 'Invalid map' });
		}
		map = await res.locals
			.dataPlaneRetry('showRuntimeMap', {
				map: req.params.name
			})
			.then(res => res.data);
	} catch (e) {
		console.error(e);
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
		case process.env.BLOCKED_IP_MAP_NAME:
		case process.env.BLOCKED_ASN_MAP_NAME:
		case process.env.BLOCKED_CC_MAP_NAME:
		case process.env.BLOCKED_CN_MAP_NAME:
		case process.env.WHITELIST_MAP_NAME:
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
	res.locals.data = { ...data,  user: res.locals.user };
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

	if (req.params.name === process.env.BLOCKED_IP_MAP_NAME
		|| req.params.name === process.env.BLOCKED_ASN_MAP_NAME
		|| req.params.name === process.env.BLOCKED_CC_MAP_NAME
		|| req.params.name === process.env.BLOCKED_CN_MAP_NAME
		|| req.params.name === process.env.WHITELIST_MAP_NAME) {
		let value;
		const existingEntries = await res.locals
			.dataPlaneRetry('showRuntimeMap', {
				map: req.params.name,
				// id: req.body.key,
			})
			.then((res) => res.data)
			.catch(() => {});
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
	} else if (req.params.name === process.env.HOSTS_MAP_NAME
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
		try {
			if (process.env.CUSTOM_BACKENDS_ENABLED && req.params.name === process.env.HOSTS_MAP_NAME) {
				//Make sure to also update backends map if editing hosts map and putting duplicate
				const backendEntries = await res.locals
					.dataPlaneRetry('showRuntimeMap', {
						map: process.env.BACKENDS_MAP_NAME,
					})
					.then((res) => res.data);
				const matchingBackends = backendEntries
					.filter(mb => mb.key === req.body.key);
				console.log('matchingBackends', matchingBackends);
				await Promise.all(matchingBackends.map(async mb => {
					return Promise.all([
						res.locals
							.dataPlaneAll('deleteRuntimeServer', {
								backend: 'servers',
								name: mb.value,
							}, null, null, false, true),
						res.locals
							.dataPlaneAll('deleteRuntimeMapEntry', {
								map: process.env.BACKENDS_MAP_NAME,
								id: mb.key, //'example.com'
							}, null, null, false, true)
					]);
				}));
			}
			await res.locals
				.dataPlaneAll('deleteRuntimeMapEntry', {
					map: req.params.name, //'ddos'
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
		if (req.params.name === process.env.BLOCKED_IP_MAP_NAME
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

		//validate key is ASN
		if (req.params.name === process.env.BLOCKED_ASN_MAP_NAME) {
			if (!/^\d+$/.test(req.body.key)) {
				return dynamicResponse(req, res, 403, { error: 'Invalid ASN' });
			}
			//req.body.key is a number
		}

		//validate key is country code
		if (req.params.name === process.env.BLOCKED_CC_MAP_NAME) {
			if (!countryMap[req.body.key]) {
				return dynamicResponse(req, res, 403, { error: 'Invalid country code' });
			}
			//req.body.key is a cc
		}

		//validate key is country code
		if (req.params.name === process.env.BLOCKED_CN_MAP_NAME) {
			if (!continentMap[req.body.key]) {
				return dynamicResponse(req, res, 403, { error: 'Invalid continent code' });
			}
			//req.body.key is a cn
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
				parsedValue = url.parse(`https://${req.body.value}`);
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
			case process.env.BLOCKED_IP_MAP_NAME:
			case process.env.BLOCKED_ASN_MAP_NAME:
			case process.env.BLOCKED_CC_MAP_NAME:
			case process.env.BLOCKED_CN_MAP_NAME:
			case process.env.WHITELIST_MAP_NAME: {
				const existingEntry = await res.locals
					.dataPlaneRetry('getRuntimeMapEntry', {
						map: req.params.name,
						id: req.body.key,
					})
					.then((res) => res.data)
					.catch(() => {});
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
					pt: req.body.pt === 'argon2' ? 'argon2' : 'sha256',
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
					.dataPlaneRetry('getRuntimeMapEntry', {
						map: process.env.BACKENDS_MAP_NAME,
						id: req.body.key,
					})
					.then(res => res.data)
					.catch(() => {});
				const freeSlotId = await res.locals
					.dataPlaneRetry('getRuntimeServers', {
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
				const serverName = `websrv${freeSlotId}`;
				const runtimeServerResp = await res.locals
					.dataPlaneAll('addRuntimeServer', {
						backend: 'servers',
					}, {
						address,
						port: parseInt(port),
						name: serverName,
						// id: `${freeSlotId}`,
						// ssl_cafile: '/usr/local/share/ca-certificates/dev-priv-ca/ca-cert.pem',
						// ssl_cafile: '@system-ca',
						ssl_reuse: 'enabled',
						ssl: 'enabled',
						verify: 'required',
					}, null, false, true);
				console.log('added runtime server', req.body.key, runtimeServerResp.data);
				await res.locals
					.dataPlaneAll("replaceRuntimeServer", {
						name: serverName,
						backend: "servers",
					}, {
						admin_state: "ready",
						operational_state: "up",
					}, null, false, true);
				if (backendMapEntry) {
					console.info('Setting multiple domain->ip entries for', req.body.key, backendMapEntry);
					// Have to show the whole map because getRuntimeMapEntry will only have first value (why? beats me)
					const fullBackendMap = await res.locals
						.dataPlaneRetry('showRuntimeMap', {
							map: process.env.BACKENDS_MAP_NAME
						})
						.then(res => res.data);
					const fullBackendMapEntry = fullBackendMap
						.find(entry => entry.key === req.body.key); //Find is OK because there shouldn't be duplicate keys
					await res.locals
						.dataPlaneAll('replaceRuntimeMapEntry', {
							map: process.env.BACKENDS_MAP_NAME,
							id: req.body.key,
						}, {
							value: `${fullBackendMapEntry.value},websrv${freeSlotId}`,
						}, null, false, false);
				} else {
					await res.locals
						.dataPlaneAll('addPayloadRuntimeMap', {
							name: process.env.BACKENDS_MAP_NAME,
						}, [{
							key: req.body.key,
							value: `websrv${freeSlotId}`,
						}], null, false, false);
				}
			}

			const existingEntry = req.params.name === process.env.HOSTS_MAP_NAME
				? null
				: (await res.locals
					.dataPlaneRetry('getRuntimeMapEntry', {
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
					}, null, false, false);
			} else {
				await res.locals
					.dataPlaneAll('addPayloadRuntimeMap', {
						name: req.params.name
					}, [{
						key: req.body.key,
						value: value,
					}], null, null, false);
			}
			await db.db().collection('mapnotes').replaceOne({
				username: res.locals.user.username,
				map: req.params.name,
				key: req.body.key,
			}, {
				username: res.locals.user.username,
				map: req.params.name,
				key: req.body.key,
				note: req.body.note,
			}, {
				upsert: true,
			});
			return dynamicResponse(req, res, 302, { redirect: req.body.onboarding ? '/onboarding' : `/map/${req.params.name}` });
		} catch (e) {
			return next(e);
		}
	}
	return dynamicResponse(req, res, 400, { error: 'Invalid value' });
}
