import { dynamicResponse } from '../../util.js';
import { createCIDR, parse } from 'ip6addr';
import { continentMap, countryMap } from '../misc/geo.js';
import { protectionModeSet, susLevelSet } from './labels.js';

export async function backendIpAllowed(dataPlaneRetry, username, backendIp) {
	const hostsMap = await dataPlaneRetry('showRuntimeMap', { map: process.env.NEXT_PUBLIC_HOSTS_MAP_NAME })
		.then(r => r.data)
		.then(r => {
			return r.map(e => {
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
			.then(r => r.data);
		if (backendMapEntry) {
			return backendMapEntry.value === username; //Return true if this user already owns this backend IP
		}
	}

	return true; //No existing entry, fresh ip
}

export async function handleMapValue(req, res, next) {
	try {

		const mapName = req.params.name;
		let value;
		if ([
			process.env.NEXT_PUBLIC_REWRITE_MAP_NAME,
			process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME,
			process.env.NEXT_PUBLIC_IMAGES_MAP_NAME,
		].includes(mapName)) {
			value = req.body.value;
		} else if (mapName === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME) {
			value = `${req.body.ip}|${req.body.geo}`;
		} else if ([
			process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME,
			process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME,
			process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME,
			process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME,
			process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME,
		].includes(mapName)) {
			// fetch existing entry and append username deduped by set
			const existingEntry = await res.locals
				.dataPlaneRetry('getRuntimeMapEntry', { map: mapName, id: req.body.key })
				.then(r => r.data)
				.catch(() => { });
			if (existingEntry && existingEntry.value) {
				const parts = existingEntry.value.split(':');
				parts.push(res.locals.user.username);
				value = [...new Set(parts)].join(':');
			} else {
				value = res.locals.user.username;
			}
		} else if (mapName === process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME) {
			value = res.locals.user.username;
		} else if (mapName === process.env.NEXT_PUBLIC_DDOS_MAP_NAME) {
			value = JSON.stringify({
				m: parseInt(req.body.m || 1, 10),
				l: parseInt(req.body.l || 1, 10),
			});
		} else if (mapName === process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME) {
			value = JSON.stringify({
				pd: parseInt(req.body.pd || 24, 10),
				pt: req.body.pt === 'argon2' ? 'argon2' : 'sha256',
				cex: parseInt(req.body.cex || 21600, 10),
				cip: req.body.cip === true ? true : false,
				js: req.body.js === true ? true : false,
			});
		} else if (mapName === process.env.NEXT_PUBLIC_CSS_MAP_NAME) {
			value = encodeURIComponent(req.body.value);
		} else {
			dynamicResponse(req, res, 400, { error: 'Invalid map' });
			return;
		}

		return value;
	} catch (err) {
		next(err);
		return;
	}
};

export async function handleMapKey(req, res, next) {
	try {

		// css requires a non empty string value
		if (
			req.params.name === process.env.NEXT_PUBLIC_CSS_MAP_NAME &&
			(!req.body || !req.body.value || typeof req.body.value !== 'string')
		) {
			dynamicResponse(req, res, 400, { error: 'Invalid input' });
			return;
		}

		// images must be the supported image type and normalize key to hostname/path
		if (req.params.name === process.env.NEXT_PUBLIC_IMAGES_MAP_NAME) {
			if (req.body.image !== 'bot-check') {
				dynamicResponse(req, res, 400, { error: 'Invalid input' });
				return;
			}
			const { hostname } = new URL(`https://${req.body.key}`);
			req.body.key = `${hostname}/${process.env.NEXT_PUBLIC_DOT_PATH}/pow-icon`;
		}

		// validate key is valid ip or cidr and normalize
		if (
			[
				process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME,
				process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME,
			].includes(req.params.name)
		) {
			let parsedIp = null;
			let parsedSubnet = null;
			try {
				parsedIp = parse(req.body.key);
			} catch { }
			try {
				parsedSubnet = createCIDR(req.body.key);
			} catch { }
			const parsedIpOrSubnet = parsedIp || parsedSubnet;
			if (!parsedIpOrSubnet) {
				dynamicResponse(req, res, 400, { error: 'Invalid input' });
				return;
			}
			req.body.key = parsedIpOrSubnet.toString({ zeroElide: false, zeroPad: false });
		}

		// validate key is ASN digits only
		if (req.params.name === process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME) {
			if (!/^\d+$/.test(req.body.key)) {
				dynamicResponse(req, res, 403, { error: 'Invalid ASN' });
				return;
			}
		}

		// validate key is country code
		if (req.params.name === process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME) {
			if (!countryMap[req.body.key]) {
				dynamicResponse(req, res, 403, { error: 'Invalid country code' });
				return;
			}
		}

		// validate key is continent code
		if (req.params.name === process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME) {
			if (!continentMap[req.body.key] || req.body.key === 'XX') {
				dynamicResponse(req, res, 403, { error: 'Invalid continent code' });
				return;
			}
		}

		// validate value is roughly a url
		if (
			[
				process.env.NEXT_PUBLIC_REWRITE_MAP_NAME,
				process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME,
				process.env.NEXT_PUBLIC_IMAGES_MAP_NAME,
			].includes(req.params.name)
		) {
			try {
				new URL(`http://${req.body.value}`);
			} catch {
				dynamicResponse(req, res, 400, { error: 'Invalid input' });
				return;
			}
		}

		// validate ddos_config numeric constraints
		if (req.params.name === process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME) {
			const { pd, cex } = req.body;
			if ((pd && (isNaN(pd) || parseInt(pd, 10) !== +pd || pd < 8))
				|| (cex && (isNaN(cex) || parseInt(cex, 10) !== +cex))) {
				dynamicResponse(req, res, 400, { error: 'Invalid input' });
				return;
			}
		}

		// validate ddos values and ranges
		if (req.params.name === process.env.NEXT_PUBLIC_DDOS_MAP_NAME) {
			if (!req.body.m || !protectionModeSet.has(req.body.m.toString())) {
				dynamicResponse(req, res, 400, { error: 'Invalid value' });
				return;
			}
			if (req.body.l != null && !susLevelSet.has(req.body.l.toString())) {
				dynamicResponse(req, res, 400, { error: 'Invalid value' });
				return;
			}
			const { m } = req.body;
			if (m && (isNaN(m) || parseInt(m, 10) !== +m || m < 0)) {
				dynamicResponse(req, res, 400, { error: 'Invalid input' });
				return;
			}
		}

		// validate hosts value ip:port and normalize req.body.ip to host:port
		if (req.params.name === process.env.NEXT_PUBLIC_HOSTS_MAP_NAME) {
			if (!req.body.geo || typeof req.body.geo !== 'string' || !continentMap[req.body.geo]) {
				dynamicResponse(req, res, 403, { error: 'Invalid backend geo route value' });
				return;
			}
			let parsedValue;
			try {
				parsedValue = new URL(`scheme://${req.body.ip}`);
				if (!parsedValue.host || !parsedValue.port) {
					console.warn('parsedValue no host or port:', parsedValue);
					dynamicResponse(req, res, 400, { error: 'Invalid input' });
					return;
				}
			} catch (e) {
				console.warn(e);
				dynamicResponse(req, res, 400, { error: 'Invalid input' });
				return;
			}
			req.body.ip = parsedValue.host;
		}

		return true;
	} catch (err) {
		next(err);
		return;
	}
};
