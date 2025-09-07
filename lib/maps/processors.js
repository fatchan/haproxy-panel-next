import * as db from '../../db.js';

export async function getMapNotes(username, mapName) {
	const notes = await db.db().collection('mapnotes').find({
		username,
		map: mapName
	}).toArray();
	return notes.reduce((acc, note) => {
		acc[note.key] = note.note;
		return acc;
	}, {});
}

// json parse some values
export function parseJsonValues({ map, showValues: _showValues }) {
	map = map.map(a => {
		try {
			a.value = JSON.parse(a.value);
		} catch {
			console.warn('Failed to parse map value', a.value);
			return undefined;
		}
		return a;
	}).filter(Boolean);
	return { map, showValues: _showValues };
}

// decodeURIComponent values for css strings (for valid map value)
export function decodeValues({ map, showValues: _showValues }) {
	map = map.map(a => {
		try {
			a.value = decodeURIComponent(a.value);
		} catch {
			console.warn('Failed to parse map value', a.value);
			return undefined;
		}
		return a;
	}).filter(Boolean);
	return { map, showValues: _showValues };
}

// Images map processor: filter pow-icon path, convert key to hostname, wrap value object
export function imagesProcessor({ map, showValues: _showValues }) {
	map = map.filter(a => {
		const { pathname } = new URL(`https://${a.key}`);
		const isPowIconPath = pathname === `/${process.env.NEXT_PUBLIC_DOT_PATH}/pow-icon`;
		return isPowIconPath;
	});
	map = map.map(a => ({
		...a,
		key: new URL(`http://${a.key}`).hostname,
		value: {
			image: 'bot-check', // TODO: dynamic later
			value: a.value,
		}
	}));
	return { map, showValues: _showValues };
}

// redirect/rewrite keeps non-pow-icon paths only
export function rewritesRedirects({ map, showValues: _showValues }) {
	map = map.filter(a => {
		const { pathname } = new URL(`https://${a.key}`);
		const isPowIconPath = pathname === `/${process.env.NEXT_PUBLIC_DOT_PATH}/pow-icon`;
		return !isPowIconPath;
	});
	return { map, showValues };
}

// enable showing raw values
export function showValues({ map, showValues: _showValues }) {
	_showValues = true;
	return { map, showValues: _showValues };
}

// convert "ip|geo" into object
export function parseHostsValues({ map, showValues: _showValues }) {
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
	return { map, showValues: _showValues };
}

// filter entries to users domains
export function filterToUserDomains({ map, showValues: _showValues, res }) {
	map = map.filter(a => {
		const { hostname } = new URL(`https://${a.key}`);
		return res.locals.user.domains.includes(hostname);
	});
	return { map, showValues: _showValues };
}

// filter only keepsp entries that mention username, set value to username
export function userValueSplitFilter({ map, showValues: _showValues, res }) {
	map = map
		.filter(a => a.value && a.value.split(':').includes(res.locals.user.username))
		.map(x => {
			x.value = res.locals.user.username;
			return x;
		});
	return { map, showValues: _showValues };
}

//ordered processors for each map
export const nameToProcessors = {
	[process.env.NEXT_PUBLIC_DDOS_MAP_NAME]: [parseJsonValues, showValues, filterToUserDomains],
	[process.env.NEXT_PUBLIC_DDOS_CONFIG_MAP_NAME]: [parseJsonValues, showValues, filterToUserDomains],

	[process.env.NEXT_PUBLIC_CSS_MAP_NAME]: [decodeValues, rewritesRedirects, showValues, filterToUserDomains],

	[process.env.NEXT_PUBLIC_REWRITE_MAP_NAME]: [rewritesRedirects, showValues, filterToUserDomains],
	[process.env.NEXT_PUBLIC_REDIRECT_MAP_NAME]: [rewritesRedirects, showValues, filterToUserDomains],
	[process.env.NEXT_PUBLIC_IMAGES_MAP_NAME]: [imagesProcessor, showValues, filterToUserDomains],

	[process.env.NEXT_PUBLIC_BACKENDS_MAP_NAME]: [showValues, filterToUserDomains],
	[process.env.NEXT_PUBLIC_HOSTS_MAP_NAME]: [parseHostsValues, showValues, filterToUserDomains],

	[process.env.NEXT_PUBLIC_MAINTENANCE_MAP_NAME]: [filterToUserDomains],

	[process.env.NEXT_PUBLIC_BLOCKED_IP_MAP_NAME]: [userValueSplitFilter],
	[process.env.NEXT_PUBLIC_BLOCKED_ASN_MAP_NAME]: [userValueSplitFilter],
	[process.env.NEXT_PUBLIC_BLOCKED_CC_MAP_NAME]: [userValueSplitFilter],
	[process.env.NEXT_PUBLIC_BLOCKED_CN_MAP_NAME]: [userValueSplitFilter],
	[process.env.NEXT_PUBLIC_WHITELIST_MAP_NAME]: [userValueSplitFilter],
};
