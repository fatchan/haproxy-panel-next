'use strict';

process
        .on('uncaughtException', console.error)
        .on('unhandledRejection', console.error);

const dotenv = require('dotenv')
dotenv.config({ path: '.env' });

const { InfluxDB, Point } = require('@influxdata/influxdb-client')
	, OpenAPIClientAxios = require('openapi-client-axios').default
	, definition = require('./openapi-definition.js')
	, { statsData } = require('./controllers/account.js')
	, agent = require('./agent.js');


if (!process.env.INFLUX_HOST) {
	return console.warn('INFLUX_HOST not set, statistics will not be recorded');
}

const writeApi = new InfluxDB({ url: process.env.INFLUX_HOST, token: (process.env.INFLUX_TOKEN || null) }).getWriteApi('proxmox', 'proxmoxdb');
const clusterUrls = process.env.DEFAULT_CLUSTER.split(',').map(u => new URL(u));
const base64Auth = Buffer.from(`${clusterUrls[0].username}:${clusterUrls[0].password}`).toString("base64");
const dataPlaneAll = async (operationId, parameters, data, config) => {
	const promiseResults = await Promise.all(clusterUrls.map(clusterUrl => {
		const singleApi = new OpenAPIClientAxios({ definition, axiosConfigDefaults: { httpsAgent: agent, headers: { 'authorization': `Basic ${base64Auth}` } } });
		const singleApiInstance = singleApi.initSync();
		singleApiInstance.defaults.baseURL = `${clusterUrl.origin}/v2`;
		return singleApiInstance[operationId](parameters, data, { ...config, baseUrl: `${clusterUrl.origin}/v2` });
	}));
	return promiseResults.map(p => p.data);
};

const sendStats = async () => {
	try {
		const { frontendStats, serverStats } = await statsData(null, { locals: { dataPlaneAll }}, null);
		let points = [];
		const now = new Date();
		frontendStats.forEach((s, i) => {
			const hostname = clusterUrls[i].hostname;
			const statPoints = Object.entries(s[0].stats[0].stats)
				.map(e => {
					return new Point(e[0])
						.tag('type', 'frontend')
						.tag('hostname', hostname)
						.floatField('value', e[1])
						.timestamp(now);
				});
			points = points.concat(statPoints);
		});
		serverStats.forEach((host, i) => {
			const hostname = clusterUrls[i].hostname;
			host.forEach(server => {
				 server.stats.forEach(ss => {
					const statPoints = Object.entries(ss.stats)
						.map(e => {
							return new Point(e[0])
								.tag('type', 'backend')
								.tag('hostname', hostname)
								.tag('server_name', ss.name)
								.tag('server_address', ss.stats["Address"])
								.floatField('value', e[1])
								.timestamp(now);
						});
					points = points.concat(statPoints);
				 });
			});
		});
		writeApi.writePoints(points)
		writeApi.flush()
			.then(() => console.log('flushed stats to influxdb'))
			.catch((e) => console.error(e));
		
	} catch (e) {
		console.error('Error writing stats:', e);
	}
}
sendStats()
setInterval(sendStats, 30000);

