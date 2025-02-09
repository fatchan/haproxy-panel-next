import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
const edgeDomains = process.env.OME_EDGE_HOSTNAMES.split(',').map(x => x.trim());
const omeAuthHeader = Buffer.from(process.env.OME_API_SECRET).toString('base64');

export const useOvenMedia = (req, res, next) => {
	res.locals.ovenMediaConclude = (streamsId, appName) => {
		edgeDomains.forEach(d => fetch(`https://${d}/api/v1/vhosts/default/apps/app/streams/${res.locals.user.streamsId}+${appName}:concludeHlsLive`, {
			method: 'POST',
			headers: {
				'Authorization': `Basic ${omeAuthHeader}`,
			}
		}).catch(e => console.warn('Failed to conclude stream on host', d, 'Error:', e)));
	};
	next();
};
