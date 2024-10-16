import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });

//TODO: refactor to stats lib
async function statsFetch(query, start, end) {
	const response = await fetch(`${process.env.STATS_BASE_URL}/loki/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=60`);
	const data = await response.json();
	return data.data.result;
}

// response code breakdown chart function
function processStatusChartData(result) {
	const timeSeriesData = {};
	result.forEach(item => {
		item.values.forEach(value => {
			const timestamp = new Date(value[0] * 1000).toISOString();
			const status = item.metric.status;
			const count = Math.round(parseFloat(value[1]));

			if (!timeSeriesData[timestamp]) {
				timeSeriesData[timestamp] = { time: timestamp };
			}

			timeSeriesData[timestamp][status] = (timeSeriesData[timestamp][status] || 0) + count;
		});
	});
	return Object.values(timeSeriesData);
}

function processHostnameChartData(result) {
	const timeSeriesData = {};
	result.forEach(item => {
		item.values.forEach(value => {
			const timestamp = new Date(value[0] * 1000).toISOString();
			const hh = item.metric.hh;
			if (!hh) { return; }
			const count = Math.round(parseFloat(value[1]));

			if (!timeSeriesData[timestamp]) {
				timeSeriesData[timestamp] = { time: timestamp };
			}

			timeSeriesData[timestamp][hh] = (timeSeriesData[timestamp][hh] || 0) + count;
		});
	});
	return Object.values(timeSeriesData);
}

async function statsData(_req, res, _next) {
	const regexPattern = res.locals.user.domains.map(domain => domain.replace(/\./g, '\\\\.')).join('|');
	const endTime = Math.floor(Date.now() / 1000);
	const startTime = Math.floor((Date.now() - 3600000) / 1000); // 1 hour for now

	const statusQuery = `sum by(status) (rate({job="haproxy", hh=~"${regexPattern}"} | json | status != \`\` | __error__ != \`JSONParserErr\` [2m]))`;
	const hostnameQuery = `sum by(hh) (rate({job="haproxy", hh=~"${regexPattern}"} | json | __error__ != \`JSONParserErr\` | status != \`-1\` [2m])) or vector(0)`;
	const [statusChartData, hostnameChartData] = await Promise.all([
		statsFetch(statusQuery, startTime, endTime).then(processStatusChartData),
		statsFetch(hostnameQuery, startTime, endTime).then(processHostnameChartData)
	]);

	return {
		statusChartData,
		hostnameChartData,
	};
}

/**
 * GET /stats.json
 * stats json
 */
export async function statsJson(req, res, next) {
	const data = await statsData(req, res, next);
	return res.json({ ...data, user: res.locals.user });
}

/**
 * GET /stats
 * stats page html
 */
export async function statsPage(app, req, res, next) {
	//Not fetching on initial yet since stats is not useful to ssr and is slower
	const data = {}; //await statsData(req, res, next);
	res.locals.data = { ...data, user: res.locals.user };
	return app.render(req, res, '/stats');
}
