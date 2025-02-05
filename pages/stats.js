import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import TimeSeriesChart from '../components/TimeSeriesChart.js';
import { useRouter } from 'next/router';
import withAuth from '../components/withAuth.js';

function formatLocalDateTime(date) { //avoid ISOstring weirdness w/ timezone
	const d = date.toLocaleString('en-CA', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	}).replace(', ', 'T');
	return d;
}

function Stats() {

	const router = useRouter();
	const [granularity, setGranularity] = useState('1m');
	const [startTime, setStartTime] = useState(null);
	const [endTime, setEndTime] = useState(null);

	const updateQueryString = () => {
		router.push(
			{
				pathname: router.pathname,
				query: {
					granularity,
					startTime,
					endTime,
				},
			},
			undefined,
			{
				shallow: true
			},
		);
	};

	useEffect(() => {
		updateQueryString();
	}, [granularity, startTime, endTime]);
	console.log('startTime', startTime, formatLocalDateTime(new Date(new Date().setHours(new Date().getHours() - 3))));
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
						value={startTime || formatLocalDateTime(new Date(new Date().setHours(new Date().getHours() - 3)))}
						onChange={e => {
							const newStartTime = e.target.value;
							setStartTime(newStartTime);

							if (!endTime) {
								const newEndTime = formatLocalDateTime(new Date(new Date(newStartTime).getTime() + 3 * 60 * 60 * 1000));
								setEndTime(newEndTime);
							}
						}}
						className='form-control'
					/>
				</div>
				<div className='col-md-2'>
					<label htmlFor='endTime'>End Time: </label>
					<input
						type='datetime-local'
						id='endTime'
						value={endTime || formatLocalDateTime(new Date())}
						onChange={e => {
							const newEndTime = e.target.value;
							setEndTime(newEndTime);

							if (!startTime) {
								const newStartTime = formatLocalDateTime(new Date(new Date(newEndTime).getTime() - 3 * 60 * 60 * 1000));
								setStartTime(newStartTime);
							}
						}}
						className='form-control'
					/>
				</div>

			</div>

			<div className='row my-2'>

				<div className='col-xl-6 col-lg-12 mb-4 overflow-hidden'>
					<TimeSeriesChart
						yLabel={'req/s'}
						queryOptions={{ granularity, startTime, endTime, type: 'status' }}
						title='Response Code Breakdown'
						stack={true}
						formatter={v => Number(v)}
					/>
				</div>

				<div className='col-xl-6 col-lg-12 mb-4 overflow-hidden'>
					<TimeSeriesChart
						yLabel={'req/s'}
						queryOptions={{ granularity, startTime, endTime, type: 'hostname' }}
						title='Hostname Breakdown'
						fill={false}
						formatter={v => Number(v)}
						allowVerticalLegend={true}
					/>
				</div>

				<div className='col-xl-6 col-lg-12 mb-4 overflow-hidden'>
					<TimeSeriesChart
						yLabel={'mbps'}
						queryOptions={{ granularity, startTime, endTime, type: 'traffic' }}
						title='Frontend Traffic'
						fill={false}
						formatter={v => (v / 1000000).toFixed(1) + ' mbps'}
					/>
				</div>

				<div className='col-xl-6 col-lg-12 mb-4 overflow-hidden'>
					<TimeSeriesChart
						yLabel={'req/s'}
						queryOptions={{ granularity, startTime, endTime, type: 'botcheck' }}
						title='Bot Checking'
						fill={false}
						formatter={v => Number(v)}
					/>
				</div>

			</div>
		</>
	);
};

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data||{})) };
};

export default withAuth(Stats);
