import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
import { dynamicResponse } from '../util.js';
import { statsFetch, processStatusChartData, processHostnameChartData, processTrafficChartData, processBotcheckChartData } from '../lib/stats.js';

const allowedGranularities = ['30s', '1m', '2m', '5m', '10m', '30m', '1h'];

async function statsData(domains, granularity, parsedStartTime, parsedEndTime) {

	const regexPattern = domains.map(domain => domain.replace(/\./g, '\\\\.')).join('|');

	const statusQuery = `sum by(status) (rate({job="haproxy", hh=~"${regexPattern}"} | json | status != \`\` | __error__ != \`JSONParserErr\` [${granularity}]))`;
	const hostnameQuery = `sum by(hh) (rate({job="haproxy", hh=~"${regexPattern}"} | json | __error__ != \`JSONParserErr\` | status != \`-1\` [${granularity}])) or vector(0)`;
	const outgoingTrafficQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | unwrap bytes [${granularity}])) *8 or vector(0)`;
	const incomingTrafficQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | unwrap bs [${granularity}])) *8 or vector(0)`;
	const botcheckChallengeQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | server = \`<lua.bot-check>\` | status = \`403\` [${granularity}])) or vector(0)`;
	const botcheckPassedQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | req =~ \`POST .*\` | server = \`<lua.bot-check>\` | status = \`302\` [${granularity}])) or vector(0)`;

	const [statusChartData, hostnameChartData, incomingTrafficData, outgoingTrafficData, challengeData, passedData] = await Promise.all([
		statsFetch(statusQuery, parsedStartTime, parsedEndTime).then(processStatusChartData),
		statsFetch(hostnameQuery, parsedStartTime, parsedEndTime).then(processHostnameChartData),
		statsFetch(incomingTrafficQuery, parsedStartTime, parsedEndTime),
		statsFetch(outgoingTrafficQuery, parsedStartTime, parsedEndTime),
		statsFetch(botcheckChallengeQuery, parsedStartTime, parsedEndTime),
		statsFetch(botcheckPassedQuery, parsedStartTime, parsedEndTime),
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
export async function statsJson(req, res, _next) {

	const { granularity = '1m', startTime, endTime } = req.query;
	if (!allowedGranularities.includes(granularity)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid granularity' });
	}
	const defaultStartTime = new Date(Date.now() - 3 * 60 * 60 * 1000).getTime() / 1000; // 3 hours
	const defaultEndTime = new Date().getTime() / 1000; // current time

	const parsedStartTime = startTime !== 'null' ? new Date(startTime).getTime() / 1000 : defaultStartTime;
	const parsedEndTime = endTime !== 'null' ? new Date(endTime).getTime() / 1000 : defaultEndTime;
	if ((startTime && !endTime) || (!startTime && endTime)) {
		return dynamicResponse(req, res, 400, { error: 'Invalid inputs' });
	}
	if (isNaN(parsedStartTime) || isNaN(parsedEndTime) || parsedEndTime - parsedStartTime > 86400) {
		return dynamicResponse(req, res, 400, { error: 'Time range must be <24 hours' });
	}

	const data = await statsData(res.locals.user.domains, granularity, parsedStartTime, parsedEndTime);
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
