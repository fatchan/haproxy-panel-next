import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
const edgeDomains = process.env.OME_EDGE_HOSTNAMES.split(',').map(x => x.trim());
const omeAuthHeader = Buffer.from(process.env.OME_API_SECRET).toString('base64');
const edgeNameFormatter = /\b([a-z]{2}-\d+)\b/ig;
import fetch from 'node-fetch';
import agent from '../../agent.js';

export const useOvenMedia = (req, res, next) => {
	res.locals.ovenMediaConclude = (streamsId, appName) => {
		edgeDomains.forEach(d => fetch(`https://${d}/api/v1/vhosts/default/apps/app/streams/${streamsId}+${appName}:concludeHlsLive`, {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${omeAuthHeader}`,
			},
			agent
		}).catch(e => console.warn('Failed to conclude stream on host', d, 'Error:', e)));
	};
	res.locals.ovenMediaDelete = (streamsId, appName) => {
		fetch(`https://${process.env.NEXT_PUBLIC_OME_ORIGIN_HOSTNAME}:8082/v1/vhosts/default/apps/app/streams/${streamsId}+${appName}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Basic ${omeAuthHeader}`,
			},
			agent
		}).catch(e => console.warn('Failed to DELETE stream Error:', e));
	};
	res.locals.ovenMediaGetViewerCount = async (streamsId, appName) => {
		const results = await Promise.allSettled(
			edgeDomains.map((d) =>
				fetch(`https://${d}/api/v1/stats/current/vhosts/default/apps/app/streams/${streamsId}+${appName}`, {
					method: 'GET',
					headers: {
						'Authorization': `Basic ${omeAuthHeader}`,
					},
					agent
				}).then(async response => {
					if (!response.ok) {
						throw new Error(`Status: ${response.status}`);
					}
					return { data: await response.json(), edgeName: d.match(edgeNameFormatter)[0] };
				})
			)
		);
		console.log('results', results);
		const successfulResults = results
			.filter((res) => res.status === 'fulfilled')
			.map(res => res.value);
		console.log('successfulResults', JSON.stringify(successfulResults, null, 2));
		const { hlsViewers, llhlsViewers, successfulEdgeNames } = successfulResults.reduce((acc, result) => {
			const { data, edgeName } = result;
			console.log('data', data);
			if (data && data.response && data.response.connections) {
				acc.hlsViewers += data.response.connections.hlsv3 || 0;
				acc.llhlsViewers += data.response.connections.llhls || 0;
				acc.successfulEdgeNames.push(edgeName);
			}
			return acc;
		}, { hlsViewers: 0, llhlsViewers: 0, successfulEdgeNames: [] });
		return { hlsViewers, llhlsViewers, totalViewers: (hlsViewers + llhlsViewers), successfulEdgeNames };
	};

	next();
};
