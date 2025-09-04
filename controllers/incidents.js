import * as redis from '../redis.js';

const uptimeKumaAuth = Buffer.from(
	`:${process.env.UPTIME_KUMA_API_KEY}`,
).toString('base64');

/**
 * GET /incidents.json
 * get incidents from uptime kuma
 */
export async function incidentsJson(_req, res, _next) {
	if (!process.env.UPTIME_KUMA_STATUS_URL) {
		console.warn('process.env.UPTIME_KUMA_STATUS_URL not set, skipping incident check');
		return res.json([]);
	}
	const cachedRes = await redis.lockQueueClient.get('incidents');
	if (cachedRes) {
		return res.json(JSON.parse(cachedRes));
	}
	const statusData = await fetch(process.env.UPTIME_KUMA_STATUS_URL, {
		headers: {
			'Authorization': uptimeKumaAuth
		}
	}).then(r => r.json());
	let incidents = [];
	if (statusData && statusData.maintenanceList && statusData.maintenanceList.length > 0) {
		incidents = statusData.maintenanceList;
	}
	await redis.lockQueueClient.set('incidents', JSON.stringify(incidents), 'EX', 300, 'NX');
	return res.json(incidents);
}

