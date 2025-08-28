import fetch from 'node-fetch';
import dotenv from 'dotenv';
import escapeRegExp from '../misc/escaperegexp.js';
// import agent from '../../agent.js';
dotenv.config({ path: '.env' });
const clusterUrls = process.env.DEFAULT_CLUSTER.split(',').map(u => new URL(u));

export const useVarnish = (req, res, next) => {
	try {
		res.locals.purgeURL = async (url, ban = false) => {
			const method = ban === true ? 'BAN' : 'PURGE';
			const urlObject = new URL(url);
			//Handle empty query to allow purging all query variations w/o main file, because URL() parses just ? into empty search property
			let banQuery = /[^?]\?$/.test(urlObject.href) ? '?' : urlObject.search;
			const banPath = escapeRegExp(`${urlObject.pathname}${banQuery}`);
			const promiseResults = await Promise.all(
				clusterUrls.map(async (clusterUrl) => {
					console.time(`varnish ${method} (${clusterUrl.hostname}) ${url}`);
					//Note: using "host" not "hostname" to be able to purge dynamic port backend URLs
					return fetch(`${urlObject.protocol}//${clusterUrl.hostname}${urlObject.pathname}${urlObject.search}`, { //keeping path+search varnish purge(), bans use x- header for escaping
						method,
						redirect: 'manual',
						headers: {
							'Host': urlObject.host,
							'X-BasedFlare-Varnish-Key': process.env.VARNISH_SECRET_KEY,
							'X-BasedFlare-Purge-Host': urlObject.host,
							'X-BasedFlare-Purge-Url': banPath,
						},
						// agent
					}).then(async res => {
						const text = await res.text();
						console.log(text);
						if (res.status !== 200) { //Note: not using res.ok because 302's are OK and this masked the bot-check/redirect/maintenance redirect bug
							console.warn(`varnish ${method} failed with status ${res.status}, reason: ${text}`);
						}
						console.timeEnd(`varnish ${method} (${clusterUrl.hostname}) ${url}`);
					});
				})
			);
			return promiseResults[0]; // TODO: better desync handling
		};
		next();
	} catch (e) {
		console.error(e);
		return dynamicResponse(req, res, 500, { error: e });
	}
};
