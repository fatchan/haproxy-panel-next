import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BackButton from '../components/BackButton.js'
import ApiCall from '../api.js'

export default function Clusters(props) {

	const [accountData, setAccountData] = useState(props);

    React.useEffect(() => {
    	if (!accountData.user) {
	    	ApiCall('/account.json', 'GET', null, setAccountData);
	    }
    }, []);

	if (!accountData.user) {
	    return <>Loading...</>; //TODO: page with animated css placeholder boxes
	}

	const { user, maps, acls, globalAcl, csrf } = accountData;

	async function addCluster(e) {
		e.preventDefault();
		await ApiCall('/forms/cluster/add', 'POST', JSON.stringify({ _csrf: csrf, cluster: e.target.cluster.value }), null, 0.5);
		await ApiCall('/account.json', 'GET', null, setAccountData);
	}

	async function deleteCluster(e) {
		e.preventDefault();
		await ApiCall('/forms/cluster/delete', 'POST', JSON.stringify({ _csrf: csrf, cluster: e.target.cluster.value }), null, 0.5);
		await ApiCall('/account.json', 'GET', null, setAccountData);
	}

	const domainList = user.clusters.map(c => {
		//TODO: refactor, to component
		return (
			<tr className="align-middle">
				<td className="col-1 text-center">
					<form onSubmit={deleteCluster} action="/forms/cluster/delete" method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="cluster" value={c} />
						<input className="btn btn-danger" type="submit" value="×" />
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
