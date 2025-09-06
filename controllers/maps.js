import { extractMap, dynamicResponse, metaMapMapping } from '../util.js';
import * as db from '../db.js';
import { getMapNotes, nameToProcessors } from '../lib/maps/processors.js';
import { mapValueNames } from '../lib/maps/labels.js';
import { backendIpAllowed, handleMapKey, handleMapValue } from '../lib/maps/converters.js';

/**
 * GET /maps/:name
 * Show map filtering to users domains
 */
export async function mapData(req, res, next) {
	let map,
		mapInfo,
		showValues = false,
		mapNotes = {};
	const requestedName = req.params.name;
	const mapName = metaMapMapping[requestedName] || requestedName;

	try {
		mapNotes = await getMapNotes(res.locals.user.username, mapName);

		mapInfo = await res.locals
			.dataPlaneRetry('getOneRuntimeMap', mapName)
			.then(r => r.data)
			.then(extractMap);

		if (!mapInfo) { return dynamicResponse(req, res, 400, { error: 'Invalid map' }); }

		map = await res.locals
			.dataPlaneRetry('showRuntimeMap', { map: mapName })
			.then(r => r.data);
	} catch (e) {
		console.error(e);
		return next(e);
	}

	try {
		const processorFns = nameToProcessors[requestedName];
		if (!processorFns) { return dynamicResponse(req, res, 400, { error: 'Invalid map' }); }
		for (const proc of processorFns) {
			const result = proc({ map, mapInfo, showValues, res });
			map = result.map;
			mapInfo = result.mapInfo;
			showValues = result.showValues;
		}
	} catch (e) {
		console.error(e);
		return next(e);
	}

	return {
		mapValueNames,
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

	if ([
		process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME,
		process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME,
		process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME,
		process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME,
		process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME,
	].includes(req.params.name)) {
		/*
			Maps with split values for e.g. multi-username that get updated
		*/

		let value;
		const existingMapEntries = await res.locals
			.dataPlaneRetry('showRuntimeMap', {
				map: req.params.name,
				// id: req.body.key,
			})
			.then((r) => r.data)
			.catch(() => { });
		const existingEntry = existingMapEntries && existingMapEntries
			.find(en => en.key === req.body.key);

		// If theres an existing entry, filter and update the value with user removed
		if (existingEntry && existingEntry.value) {
			let existingEntries = existingEntry.value.split(':');
			if (!existingEntries || !existingEntries.includes(res.locals.user.username)) {
				return dynamicResponse(req, res, 403, { error: 'No permission to remove that entry' });
			}
			existingEntries = existingEntries.filter(e => e !== res.locals.user.username);
			value = existingEntries.join(':'); //0 length if was only name

			try {
				if (value && value.length > 0) {
					// if value still exists, other user has whitelisted, so replace with updated value
					await res.locals
						.dataPlaneAll('replaceRuntimeMapEntry', {
							map: req.params.name,
							id: req.body.key,
						}, {
							value: value,
						}, null, false, false);
				} else {
					// else we were the last/only one, so remove so no -m found/empty value
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

	} else if ([
		process.env.NEXT_PUBLIC_HOSTS_MAP_NAME,
		process.env.NEXT_PUBLIC_DDOS_MAP_NAME,
		process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME,
		process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME,
		process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME,
		process.env.NEXT_PUBLIC_REWRITE_MAP_NAME,
		process.env.NEXT_PUBLIC_IMAGES_MAP_NAME,
		process.env.NEXT_PUBLIC_CSS_MAP_NAME,
	].includes(req.params.name)) {
		/*
			Maps with single values that get added/overwritten
		*/

		const { hostname } = new URL(`https://${req.body.key}`);
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

			//backend map handled specially
			if (req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME) {
				//Make sure to also update backends map if editing hosts map and putting duplicate
				const matchingBackend = await res.locals
					.dataPlaneRetry('showRuntimeMap', {
						map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
					})
					.then(r => r.data)
					.then(backends => backends.find(mb => mb.key === req.body.key));

				// can happen if desynced
				if (!matchingBackend) {
					return dynamicResponse(req, res, 400, { error: 'Invalid backend state, please contact support' });
				}

				//NOTE: deletes all backends (for now, requires enhancement to match between hosts map and backends map)
				const splitValue = matchingBackend.value.split(',');
				await Promise.all([
					//delete multiple of the actual servers
					await Promise.all(splitValue.map(bsv =>
						res.locals
							.dataPlaneAll('deleteRuntimeServer', {
								backend: 'servers',
								name: bsv.substring(0, bsv.length - 3), // strip 3 chars for geo continent code and separator
							}, null, null, false, true)
					)),
					//and the single map entry w/ value separator
					res.locals
						.dataPlaneAll('deleteRuntimeMapEntry', {
							map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
							id: matchingBackend.key, // id of (possibly multi host) single row backend
						}, null, null, false, true)
				]);
			}

			//then the regular map action
			await res.locals
				.dataPlaneAll('deleteRuntimeMapEntry', {
					map: mapName, //'ddos'
					id: req.body.key, //'example.com'
				}, null, null, false, false);

		} catch (e) {
			return next(e);
		}

	}

	// update map notes in either case
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

	if (!req.body || !req.body.key || typeof req.body.key !== 'string') {
		return dynamicResponse(req, res, 400, { error: 'Invalid input' });
	}

	const mapName = metaMapMapping[req.params.name] || req.params.name;

	const validKey = handleMapKey(req, res, next);
	if (!validKey) {
		return;
	}

	const value = handleMapValue(req, res, next);
	if (!value) {
		return;
	}

	try {

		// Host name is special case where we have to update backends/servers, not just map manupulation
		if (req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME) {

			const { hostname: address, port } = new URL(`scheme://${req.body.ip}`);
			const backendAllowed = await backendIpAllowed(
				res.locals.dataPlaneRetry,
				res.locals.user.username,
				address
			);

			// prevent adding priviliged or conflicting backend IPs from another user
			if (!backendAllowed) {
				return dynamicResponse(req, res, 403, { error: 'No permission to add a backend with that IP' });
			}

			// get the backend map for existing entry dat
			const backendMapEntry = await res.locals
				.dataPlaneRetry('getRuntimeMapEntry', {
					map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
					id: req.body.key,
				})
				.catch(() => { });

			// try to fetch the number for the next server name
			const freeSlotId = await res.locals
				.dataPlaneRetry('getRuntimeServers', {
					backend: 'servers'
				})
				.then(r => r.data)
				.then(servers => {
					if (servers.length > 0) {
						const serverIds = servers
							.map(s => parseInt(s.id, 10))
							.sort((a, b) => a - b);
						const serverNameIds = servers
							.map(s => parseInt(s.name.substr(6), 10))
							.sort((a, b) => a - b);
						const highestId = Math.max(
							serverIds[serverIds.length - 1],
							serverNameIds[serverNameIds.length - 1]
						);
						// 2 in the else case Because server ID "1" is the other_port "server" and will cause a conflict on patching the server
						return !isNaN(highestId) ? highestId + 1 : 2;
					}
					return 2; // see above
				});

			// guard if "next" id not available, which shoulnt happen
			if (!freeSlotId) {
				return dynamicResponse(req, res, 400, { error: 'No server slots available' });
			}

			// add the backend server
			const serverName = `websrv${freeSlotId}`;
			const runtimeServerResp = await res.locals
				.dataPlaneAll('addRuntimeServer', {
					backend: 'servers',
				}, {
					address,
					port: parseInt(port, 10),
					name: serverName,
					ssl_cafile: 'ca-certificates.crt',
					sni: 'req.hdr(Host)',
					ssl_reuse: 'enabled',
					ssl: 'enabled',
					verify: process.env.ALLOW_SELF_SIGNED_SSL === 'true' ? 'none' : 'required',
					//
					// check: 'enabled',
					// observe: 'layer4',
					//
				}, null, false, true);

			// call repalce to set admin and operational state (cant be set on dynamic runtime servers during server "add")
			await res.locals
				.dataPlaneAll('replaceRuntimeServer', {
					name: serverName,
					backend: 'servers',
				}, {
					admin_state: 'ready',
					operational_state: 'up',
				}, null, false, true);
			console.log('added runtime server', req.body.key, runtimeServerResp.data);

			// if theres an existing backend map entry, update
			if (backendMapEntry) {
				console.info('setting load balanced backend entry:', req.body.key, backendMapEntry);
				// Have to show the whole map because getRuntimeMapEntry doesnt return multiples
				const fullBackendMap = await res.locals
					.dataPlaneRetry('showRuntimeMap', {
						map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME
					})
					.then(r => r.data);
				const fullBackendMapEntry = fullBackendMap
					.find(entry => entry.key === req.body.key); //find is OK because keys are pointers and shouldnt be dupes
				await res.locals
					.dataPlaneAll('replaceRuntimeMapEntry', {
						map: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
						id: req.body.key,
					}, {
						value: `${fullBackendMapEntry.value},websrv${freeSlotId}|${req.body.geo}`,
					}, null, false, false);
			} else {
				// otherwise add new backend
				await res.locals
					.dataPlaneAll('addPayloadRuntimeMap', {
						name: process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME,
					}, [{
						key: req.body.key,
						value: `websrv${freeSlotId}|${req.body.geo}`,
					}], null, false, false);
			}

		}

		//then do map actions
		const existingEntry = mapName === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME
			? null
			: (await res.locals
				.dataPlaneRetry('getRuntimeMapEntry', {
					map: mapName,
					id: req.body.key,
				})
				.then(r => r.data)
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
