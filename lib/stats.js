export async function statsFetch(query, start, end) {
	const response = await fetch(`${process.env.LOKI_BASE_URL}/loki/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}`);
	try {
		const data = await response.json();
		return data.data.result;
	} catch(e) {
		console.warn(e);
		return null;
	}
}

export function processStatusChartData(result=[]) {
	const timeSeriesData = {};
	result.forEach(item => {
		item.values.forEach(value => {
			const timestamp = new Date(value[0] * 1000).toLocaleTimeString();
			const status = item.metric.status || 'unknown';
			const count = value[1] < 1 ? parseFloat(value[1]).toFixed(1) : Math.round(value[1]);
			if (!timeSeriesData[timestamp]) {
				timeSeriesData[timestamp] = { time: timestamp };
			}
			timeSeriesData[timestamp][status] = (timeSeriesData[timestamp][status] || 0) + count;
		});
	});
	return Object.values(timeSeriesData);
}

export function processHostnameChartData(result=[]) {
	const timeSeriesData = {};
	result.forEach(item => {
		item.values.forEach(value => {
			const timestamp = new Date(value[0] * 1000).toLocaleTimeString();
			const hh = item.metric.hh;
			if (!hh) { return; }
			const count = value[1] < 1 ? parseFloat(value[1]).toFixed(1) : Math.round(value[1]);
			if (!timeSeriesData[timestamp]) {
				timeSeriesData[timestamp] = { time: timestamp };
			}
			timeSeriesData[timestamp][hh] = (timeSeriesData[timestamp][hh] || 0) + count;
		});
	});
	return Object.values(timeSeriesData);
}

export function processTrafficChartData(incomingData=[], outgoingData=[]) {
	const timeSeriesData = {};
	incomingData.forEach(item => {
		item.values.forEach(value => {
			const timestamp = new Date(value[0] * 1000).toLocaleTimeString();
			const count = value[1] < 1 ? parseFloat(value[1]).toFixed(1) : Math.round(value[1]);

			if (!timeSeriesData[timestamp]) {
				timeSeriesData[timestamp] = { time: timestamp, 'Incoming Traffic': 0, 'Outgoing Traffic': 0 };
			}
			timeSeriesData[timestamp]['Incoming Traffic'] += count;
		});
	});

	outgoingData.forEach(item => {
		item.values.forEach(value => {
			const timestamp = new Date(value[0] * 1000).toLocaleTimeString();
			const count = value[1] < 1 ? parseFloat(value[1]).toFixed(1) : Math.round(value[1]);

			if (!timeSeriesData[timestamp]) {
				timeSeriesData[timestamp] = { time: timestamp, 'Incoming Traffic': 0, 'Outgoing Traffic': 0 };
			}
			timeSeriesData[timestamp]['Outgoing Traffic'] += count;
		});
	});

	return Object.values(timeSeriesData);
}

export function processBotcheckChartData(challengeData=[], passedData=[]) {
	const timeSeriesData = {};

	challengeData.forEach(item => {
		item.values.forEach(value => {
			const timestamp = new Date(value[0] * 1000).toLocaleTimeString();
			const count = value[1] < 1 ? parseFloat(value[1]).toFixed(1) : Math.round(value[1]);

			if (!timeSeriesData[timestamp]) {
				timeSeriesData[timestamp] = { time: timestamp, 'Challenged': 0, 'Passed': 0 };
			}
			timeSeriesData[timestamp]['Challenged'] += count;
		});
	});

	passedData.forEach(item => {
		item.values.forEach(value => {
			const timestamp = new Date(value[0] * 1000).toLocaleTimeString();
			const count = value[1] < 1 ? parseFloat(value[1]).toFixed(1) : Math.round(value[1]);

			if (!timeSeriesData[timestamp]) {
				timeSeriesData[timestamp] = { time: timestamp, 'Passed': 0, 'Challenged': 0 };
			}
			timeSeriesData[timestamp]['Passed'] += count;
		});
	});

	return Object.values(timeSeriesData);
}
