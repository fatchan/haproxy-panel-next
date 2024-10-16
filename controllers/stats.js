import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
import { statsFetch, processStatusChartData, processHostnameChartData, processTrafficChartData, processBotcheckChartData } from '../stats/lib.js';

async function statsData(_req, res, _next) {
	const regexPattern = res.locals.user.domains.map(domain => domain.replace(/\./g, '\\\\.')).join('|');
	const endTime = Math.floor(Date.now() / 1000);
	const startTime = Math.floor((Date.now() - 3600000) / 1000); // 1 hour for now
	const statusQuery = `sum by(status) (rate({job="haproxy", hh=~"${regexPattern}"} | json | status != \`\` | __error__ != \`JSONParserErr\` [2m]))`;
	const hostnameQuery = `sum by(hh) (rate({job="haproxy", hh=~"${regexPattern}"} | json | __error__ != \`JSONParserErr\` | status != \`-1\` [2m])) or vector(0)`;
	const outgoingTrafficQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | unwrap bytes [2m])) *8 or vector(0)`;
	const incomingTrafficQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | unwrap bs [2m])) *8 or vector(0)`;
	const botcheckChallengeQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | server = \`<lua.bot-check>\` | status = \`403\` [2m])) or vector(0)`;
	const botcheckPassedQuery = `sum(rate({job="haproxy", hh=~"${regexPattern}"} | json | req =~ \`POST .*\` | server = \`<lua.bot-check>\` | status = \`302\` [2m])) or vector(0)`;

	const [statusChartData, hostnameChartData, incomingTrafficData, outgoingTrafficData, challengeData, passedData] = await Promise.all([
		statsFetch(statusQuery, startTime, endTime).then(processStatusChartData),
		statsFetch(hostnameQuery, startTime, endTime).then(processHostnameChartData),
		statsFetch(incomingTrafficQuery, startTime, endTime),
		statsFetch(outgoingTrafficQuery, startTime, endTime),
		statsFetch(botcheckChallengeQuery, startTime, endTime),
		statsFetch(botcheckPassedQuery, startTime, endTime),
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
