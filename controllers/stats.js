import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
import { statsFetch, processStatusChartData, processHostnameChartData, processTrafficChartData, processBotcheckChartData } from '../lib/stats.js';

async function statsData(_req, res, _next) {
	const regexPattern = res.locals.user.domains.map(domain => domain.replace(/\./g, '\\\\.')).join('|');
	const endTime = Math.floor(Date.now() / 1000);
	const startTime = Math.floor((Date.now() - 10800000) / 1000); // 3 hours
	const granularity = '1m';
	const statusQuery = `sum by(status) (rate({job="haproxy", hh=~"${regexPattern}"} | json | status != \`\` | __error__ != \`JSONParserErr\` [${granularity}]))`;
	const hostnameQuery = `sum by(hh) (rate({job="haproxy", hh=~"${regexPattern}"} | json | __error__ != \`JSONParserErr\` | status != \`-1\` [${granularity}])) or vector(0)`;
	const outgoingTrafficQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | unwrap bytes [${granularity}])) *8 or vector(0)`;
	const incomingTrafficQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | unwrap bs [${granularity}])) *8 or vector(0)`;
	const botcheckChallengeQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | server = \`<lua.bot-check>\` | status = \`403\` [${granularity}])) or vector(0)`;
	const botcheckPassedQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | req =~ \`POST .*\` | server = \`<lua.bot-check>\` | status = \`302\` [${granularity}])) or vector(0)`;

	const [statusChartData, hostnameChartData, incomingTrafficData, outgoingTrafficData, challengeData, passedData] = await Promise.all([
		statsFetch(statusQuery, startTime, endTime).then(processStatusChartData).catch(() => []),
		statsFetch(hostnameQuery, startTime, endTime).then(processHostnameChartData).catch(() => []),
		statsFetch(incomingTrafficQuery, startTime, endTime).catch(() => []),
		statsFetch(outgoingTrafficQuery, startTime, endTime).catch(() => []),
		statsFetch(botcheckChallengeQuery, startTime, endTime).catch(() => []),
		statsFetch(botcheckPassedQuery, startTime, endTime).catch(() => []),
	]);
	const trafficChartData = processTrafficChartData(incomingTrafficData, outgoingTrafficData);
	const botcheckChartData = processBotcheckChartData(challengeData, passedData);

	return {
		statusChartData,
		hostnameChartData,
		trafficChartData,
		botcheckChartData,
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
export async function statsPage(app, req, res, _next) {
	//Not fetching on initial yet since stats is not useful to ssr and is slower
	const data = {}; //await statsData(req, res, next);
	res.locals.data = { ...data, user: res.locals.user };
	return app.render(req, res, '/stats');
}
