import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const edgeDomains = process.env.OME_EDGE_HOSTNAMES.split(',').map(x => x.trim());
const omeAuthHeader = Buffer.from(process.env.OME_API_SECRET).toString('base64');
const edgeNameFormatter = /\b([a-z]{2}-\d+)/ig;
import * as redis from '../../redis.js';
import fetch from 'node-fetch';
import agent from '../../agent.js';

export const useOvenMedia = (_req, res, next) => {

	res.locals.ovenMediaConclude = (streamsId, appName) => {
		return Promise.all(edgeDomains.map(async d => {
			return fetch(`https://${d}/api/v1/vhosts/default/apps/app/streams/${streamsId}+${appName}:concludeHlsLive`, {
				method: 'POST',
				headers: {
					'Authorization': `Basic ${omeAuthHeader}`,
				},
				agent,
			}).catch(e => console.warn('Failed to conclude stream on host', d, 'Error:', e));
		}));
	};

	res.locals.ovenMediaDelete = async (streamsId, appName) => {
		return fetch(`https://${process.env.NEXT_PUBLIC_OME_ORIGIN_HOSTNAME}:8082/v1/vhosts/default/apps/app/streams/${streamsId}+${appName}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Basic ${omeAuthHeader}`,
			},
			agent,
		}).catch(e => console.warn('Failed to DELETE stream Error:', e));
	};

	res.locals.ovenMediaGetViewerCount = async (streamsId, appName) => {
		const cachedRes = await redis.lockQueueClient.get(`${streamsId}+${appName}`);
		if (cachedRes) {
			return JSON.parse(cachedRes); //todo: think about multi client
		}
		//todo: locking? not shared between multiple users so probably not
		const settledPromises = await Promise.allSettled(
			edgeDomains.map((d) =>
				fetch(`https://${d}/api/v1/stats/current/vhosts/default/apps/app/streams/${streamsId}+${appName}`, {
					method: 'GET',
					headers: {
						'Authorization': `Basic ${omeAuthHeader}`,
					},
					agent,
				}).then(async r => {
					if (!r.ok) {
						throw new Error(`Status: ${r.status}`);
					}
					return { data: await r.json(), edgeName: d.match(edgeNameFormatter)?.[0] || d };
				})
			)
		);
		const successfulResults = settledPromises
			.filter(r => r.status === 'fulfilled')
			.map(r => r.value);
		const { hlsViewers, llhlsViewers, successfulEdgeNames } = successfulResults.reduce((acc, result) => {
			const { data, edgeName } = result;
			if (data && data.response && data.response.connections) {
				acc.hlsViewers += data.response.connections.hlsv3 || 0;
				acc.llhlsViewers += data.response.connections.llhls || 0;
				acc.successfulEdgeNames.push(edgeName);
			}
			return acc;
		}, { hlsViewers: 0, llhlsViewers: 0, successfulEdgeNames: [] });
		const result = { hlsViewers, llhlsViewers, totalViewers: (hlsViewers + llhlsViewers), successfulEdgeNames };
		await redis.lockQueueClient.set(`${streamsId}+${appName}`, JSON.stringify(result), 'EX', 60, 'NX'); //60s cache per stream
		return result;
	};

	next();
};
