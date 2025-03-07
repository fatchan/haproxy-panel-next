import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
const edgeDomains = process.env.OME_EDGE_HOSTNAMES.split(',').map(x => x.trim());
const omeAuthHeader = Buffer.from(process.env.OME_API_SECRET).toString('base64');
import fetch from 'node-fetch';
import agent from '../../agent.js';

export const useOvenMedia = (req, res, next) => {
	res.locals.ovenMediaConclude = (streamsId, appName) => {
		edgeDomains.forEach(d => fetch(`https://${d}/api/v1/vhosts/default/apps/app/streams/${streamsId}+${appName}:concludeHlsLive`, {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${omeAuthHeader}`,
			}
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
	next();
};
