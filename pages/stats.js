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

	useEffect(() => {
		const fetchData = () => {
			API.getStats(dispatch, setError, router);
		};
		fetchData();
		const intervalId = setInterval(fetchData, 60000);
		return () => clearInterval(intervalId);
	}, []);

	const { statusChartData, hostnameChartData, trafficChartData, botcheckChartData } = state || {};

	return (
		<>

			<Head>
				<title>Stats</title>
			</Head>

			<h5 className='fw-bold'>
				Statistics:
			</h5>

			{!hostnameChartData && <div className='d-flex flex-column'>
				{error && <ErrorAlert error={error} />}
				<div className='text-center mb-4'>
					<div className='spinner-border mt-5' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>}
			<div className='container'>
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
			</div>
		</>
	);
};

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale}) {
	return { props: res.locals.data };
};
