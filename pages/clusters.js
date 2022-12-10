import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BackButton from '../components/BackButton.js'
import ErrorAlert from '../components/ErrorAlert.js';
import ApiCall from '../api.js'
import { useRouter } from 'next/router';

export default function Clusters(props) {

	const router = useRouter();

	const [accountData, setAccountData] = useState(props);
	const [error, setError] = useState();

    React.useEffect(() => {
    	if (!accountData.user) {
	    	ApiCall('/clusters.json', 'GET', null, setAccountData, setError,  null, router);
	    }
    }, [accountData.user, router]);

	if (!accountData.user) {
		return (
			<>
				Loading...
				{error && <ErrorAlert error={error} />}
			</>
		);
	}

	const { user, csrf } = accountData;

	async function addCluster(e) {
		e.preventDefault();
		await ApiCall('/forms/cluster/add', 'POST', JSON.stringify({ _csrf: csrf, cluster: e.target.cluster.value }), null, setError, 0.5, router);
		await ApiCall('/clusters.json', 'GET', null, setAccountData, setError, null, router);
	}

	async function deleteCluster(e) {
		e.preventDefault();
		await ApiCall('/forms/cluster/delete', 'POST', JSON.stringify({ _csrf: csrf, cluster: e.target.cluster.value }), null, setError, 0.5, router);
		await ApiCall('/clusters.json', 'GET', null, setAccountData, setError, null, router);
	}

	async function setCluster(e) {
		e.preventDefault();
		await ApiCall('/forms/cluster', 'POST', JSON.stringify({ _csrf: csrf, cluster: e.target.cluster.value }), null, setError, 0.5, router);
		await ApiCall('/clusters.json', 'GET', null, setAccountData, setError, null, router);
	}

	const domainList = user.clusters.map((c, i) => {
		//TODO: refactor, to component
		return (
			<tr key={c} className="align-middle">
				<td className="col-1 text-center">
					<form onSubmit={deleteCluster} action="/forms/cluster/delete" method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="cluster" value={c} />
						<input className="btn btn-danger" type="submit" value="×" />
					</form>
				</td>
				<td className="col-1 text-center">
					<form onSubmit={setCluster} action="/forms/cluster" method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="cluster" value={i} />
						<input className="btn btn-primary" type="submit" value="Select" disabled={(i === user.activeCluster ? 'disabled' : null)} />
					</form>
				</td>
				<td>
					{c}
				</td>
			</tr>
		);
	})

	return (
		<>
			<Head>
				<title>Clusters</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className="fw-bold">
				Clusters ({user.clusters.length}):
			</h5>

			{/* Clusters table */}
			<div className="table-responsive">
				<table className="table table-bordered text-nowrap">
					<tbody>

						{domainList}

						{/* Add new domain form */}
						<tr className="align-middle">
							<td className="col-1 text-center" colSpan="3">
								<form className="d-flex" onSubmit={addCluster} action="/forms/cluster/add" method="post">
									<input type="hidden" name="_csrf" value={csrf} />
									<input className="btn btn-success" type="submit" value="+" />
									<input className="form-control mx-3" type="text" name="cluster" placeholder="tcp://host1:port,tcp://host2:port,..." required />
								</form>
							</td>
						</tr>

					</tbody>
				</table>
			</div>

			{/* back to account */}
			<BackButton to="/account" />

		</>
	);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
}
