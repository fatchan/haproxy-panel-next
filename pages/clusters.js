import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import ClusterRow from '../components/ClusterRow.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';

export default function Clusters(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getClusters(dispatch, setError, router);
		}
	}, [state.user, router]);

	if (!state.user) {
		return (
			<div className='d-flex flex-column'>
				{error && <ErrorAlert error={error} />}
				<div className='text-center mb-4'>
					<div className='spinner-border mt-5' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	const { user, csrf } = state;

	if (user && !user.onboarding) {
		router.push('/onboarding');
	}

	async function addCluster(e) {
		e.preventDefault();
		setError(null);
		await API.addCluster({ _csrf: csrf, cluster: e.target.cluster.value }, dispatch, setError, router);
		await API.getClusters(dispatch, setError, router);
		e.target.reset();
	}

	async function deleteCluster(csrf, cluster) {
		setError(null);
		await API.deleteCluster({ _csrf: csrf, cluster }, dispatch, setError, router);
		await API.getClusters(dispatch, setError, router);
	}

	async function setCluster(csrf, cluster) {
		setError(null);
		await API.changeCluster({ _csrf: csrf, cluster }, dispatch, setError, router);
		await API.getClusters(dispatch, setError, router);
	}

	const clusterList = user.clusters.map((cluster, i) => (<ClusterRow
		i={i}
		key={cluster}
		cluster={cluster}
		csrf={csrf}
		user={user}
		setCluster={setCluster}
		deleteCluster={deleteCluster}
	/>));

	return (
		<>
			<Head>
				<title>Clusters</title>
			</Head>

			<h5 className='fw-bold'>
				Clusters ({user.clusters.length}):
			</h5>

			{/* Clusters table */}
			<div className='table-responsive'>
				<form className='d-flex' onSubmit={addCluster} action='/forms/cluster/add' method='post'>
					<input type='hidden' name='_csrf' value={csrf} />
					<table className='table text-nowrap'>
						<tbody>

							{clusterList}

							{/* Add new cluster form */}
							<tr className='align-middle'>
								<td>
									<button className='btn btn-sm btn-success' type='submit'>
										<i className='bi-plus-lg pe-none' width='16' height='16' />
									</button>
								</td>
								<td colSpan='2'>

									<input className='form-control' type='text' name='cluster' placeholder='http://username:password@host:port, comma separated for multiple' required />
								</td>
							</tr>

						</tbody>
					</table>
				</form>
			</div>

			{error && <span className='mx-1'>
				<ErrorAlert error={error} />
			</span>}

			{/* back to account */}
			<BackButton to='/account' />

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } };
}
