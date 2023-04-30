import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js'
import { useRouter } from 'next/router';

export default function Domains(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getStats(dispatch, setError, router);
		}
	}, [state.user, router]);

	if (!state.user) {
		return (
			<div className="d-flex flex-column">
				{error && <ErrorAlert error={error} />}
				<div className="text-center mb-4">
					Loading...
				</div>
			</div>
		);
	}

	const { user, frontendStats, serverStats } = state;

	//TODO: refresh function

	const clusterServers = user.clusters[user.activeCluster]
		.split(',')
		.map(s => {
			return new URL(s).hostname;
		})

	return (
		<>

			<Head>
				<title>Statistics</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className="fw-bold">
				Frontend Stats:
			</h5>

			<div className="table-responsive">
				<table className="table text-nowrap m-1">
					<tbody>

						<tr>
							<th>Hostname</th>
							{Object.keys(frontendStats[0][0].stats.find(s => s.name === 'www-http-https').stats)
								.map(key => <th key={'fe_th_'+key}>{key}</th>)}
						</tr>

						{frontendStats
							.map(s => {
								return s[0].stats.find(k => k.name === 'www-http-https').stats;
							})
							.map((s, i) => {
								return (<tr key={'fe_stat_'+i}>
									<td>{clusterServers[i]}</td>
									{Object.values(s)
										.map((v, j) => <td key={'fe_stat_val'+i+'_'+j}>{v}</td>)}
								</tr>);
							})}

					</tbody>
				</table>
			</div>

			<h5 className="fw-bold mt-4">
				Backend Stats:
			</h5>

			<div className="table-responsive">
				<table className="table table-bordered text-nowrap">
					<tbody>

						<tr>
							<th>Hostname</th>
							<th>Server</th>
							{Object.keys(serverStats[0][0].stats.find(s => s.backend_name === 'servers').stats)
								.map(key => <th key={'be_th_'+key}>{key}</th>)}
						</tr>

						{serverStats
							.map((host, hi) => {
								return host.map(s => {
									// return s[0].stats.find(k => k.backend_name === 'servers');
									return s.stats.map((s, i) => {
										return (<tr key={'be_stat_'+i}>
											<td>{clusterServers[hi]}</td>
											<td>{s.name}</td>
											{Object.values(s.stats)
												.map((v, j) => <td key={'be_stat_val'+i+'_'+j}>{v}</td>)}
										</tr>);
									})
								})
								.reduce((acc, arr) => {
									return acc.concat(arr);
								}, []);
							})
							.reduce((acc, arr) => {
								return acc.concat(arr);
							}, [])}

					</tbody>
				</table>
			</div>

			{/* back to account */}
			<BackButton to="/account" />

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
}
