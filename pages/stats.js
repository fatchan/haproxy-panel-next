import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ErrorAlert from '../components/ErrorAlert.js';
import TimeSeriesChart from '../components/TimeSeriesChart.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';

export default function Stats(props) {
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [granularity, setGranularity] = useState('1m');
	const [startTime, setStartTime] = useState(null);
	const [endTime, setEndTime] = useState(null);

	const fetchData = async () => {
		await API.getStats({ granularity, startTime, endTime }, dispatch, setError, router);
	};

	// const updateQueryString = () => {
	// 	router.push(
	// 		{
	// 			pathname: router.pathname,
	// 			query: { granularity, startTime, endTime },
	// 		},
	// 		undefined,
	// 		{ shallow: true }
	// 	);
	// };

	useEffect(() => {
		const handler = setTimeout(() => { //debouncing
			fetchData();
			// updateQueryString();
			const intervalId = setInterval(fetchData, 60000);

			return () => clearInterval(intervalId);
		}, 1000);
		return () => {
			clearTimeout(handler);
		};
	}, [granularity, startTime, endTime]);

	const { statusChartData, hostnameChartData, trafficChartData, botcheckChartData } = state || {};

	return (
		<>
			<Head>
				<title>Stats</title>
			</Head>

			<h5 className='fw-bold'>
				Statistics:
			</h5>

			<div className='row pb-1'>
				<div className='col-md-2'>
					<label htmlFor='granularity'>Granularity: </label>
					<select
						id='granularity'
						value={granularity}
						onChange={e => setGranularity(e.target.value)}
						className='form-select'
					>
						<option value='30s'>30s</option>
						<option value='1m'>1m</option>
						<option value='2m'>2m</option>
						<option value='5m'>5m</option>
						<option value='10m'>10m</option>
						<option value='30m'>30m</option>
						<option value='1h'>1h</option>
					</select>
				</div>
				<div className='col-md-6' />
				<div className='col-md-2'>
					<label htmlFor='startTime'>Start Time: </label>
					<input
						type='datetime-local'
						id='startTime'
						value={startTime}
						onChange={e => setStartTime(e.target.value)}
						className='form-control'
					/>
				</div>
				<div className='col-md-2'>
					<label htmlFor='endTime'>End Time: </label>
					<input
						type='datetime-local'
						id='endTime'
						value={endTime}
						onChange={e => setEndTime(e.target.value)}
						className='form-control'
					/>
				</div>
			</div>

			{!hostnameChartData && (
				<div className='d-flex flex-column'>
					{error && <ErrorAlert error={error} />}
					<div className='text-center mb-4'>
						<div className='spinner-border mt-5' role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				</div>
			)}

			<div className='row'>
				{statusChartData && (
					<div className='col-xl-6 col-lg-12 mb-4'>
						<TimeSeriesChart
							yLabel={'req/s'}
							data={statusChartData}
							title={'Response Code Breakdown'}
							stack={true}
							formatter={v => Number(v)}
						/>
					</div>
				)}
				{hostnameChartData && (
					<div className='col-xl-6 col-lg-12 mb-4'>
						<TimeSeriesChart
							yLabel={'req/s'}
							data={hostnameChartData}
							title={'Hostname Breakdown'}
							fill={false}
							formatter={v => Number(v)}
							allowVerticalLegend={true}
						/>
					</div>
				)}
				{trafficChartData && (
					<div className='col-xl-6 col-lg-12 mb-4'>
						<TimeSeriesChart
							yLabel={'mbps'}
							data={trafficChartData}
							title={'Frontend Traffic'}
							fill={false}
							formatter={v => (v / 1000000).toFixed(1) + ' mbps'}
						/>
					</div>
				)}
				{botcheckChartData && (
					<div className='col-xl-6 col-lg-12 mb-4'>
						<TimeSeriesChart
							yLabel={'req/s'}
							data={botcheckChartData}
							title={'Bot Checking'}
							fill={false}
							formatter={v => Number(v)}
						/>
					</div>
				)}
			</div>
		</>
	);
};

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale}) {
	return { props: res.locals.data };
};
