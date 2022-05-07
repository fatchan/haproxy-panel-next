import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import BackButton from '../components/BackButton.js';
import LoadingPlaceholder from '../components/LoadingPlaceholder.js';
import ApiCall from '../api.js'

export default function Domains(props) {

	const [accountData, setAccountData] = useState(props);

    React.useEffect(() => {
    	if (!accountData.user) {
	    	ApiCall('/domains.json', 'GET', null, setAccountData);
	    }
    }, []);

	if (!accountData.user) {
	   return (
			<>
				
				<Head>
					<title>Domains</title>
				</Head>

				<h5 className="fw-bold">
					Available Domains:
				</h5>
				
				<div className="list-group">
					<LoadingPlaceholder />
					<LoadingPlaceholder />
					<LoadingPlaceholder />
					<LoadingPlaceholder />
					<LoadingPlaceholder />
					<LoadingPlaceholder />
					<LoadingPlaceholder />
					<LoadingPlaceholder />
					<LoadingPlaceholder />
					<LoadingPlaceholder />
				</div>
				
			</>
		);
	}

	const { user, csrf } = accountData;

	async function addDomain(e) {
		e.preventDefault();
		await ApiCall('/forms/domain/add', 'POST', JSON.stringify({ _csrf: csrf, domain: e.target.domain.value }), null, 0.5);
		await ApiCall('/domains.json', 'GET', null, setAccountData);
	}

	async function deleteDomain(e) {
		e.preventDefault();
		await ApiCall('/forms/domain/delete', 'POST', JSON.stringify({ _csrf: csrf, domain: e.target.domain.value }), null, 0.5);
		await ApiCall('/domains.json', 'GET', null, setAccountData);
	}

	const domainList = user.domains.map(d => {
		//TODO: refactor, to component
		return (
			<tr className="align-middle">
				<td className="col-1 text-center">
					<form onSubmit={deleteDomain} action="/forms/domain/delete" method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="domain" value={d} />
						<input className="btn btn-danger" type="submit" value="×" />
					</form>
				</td>
				<td>
					{d}
				</td>
			</tr>
		);
	})

	return (
		<>
			<Head>
				<title>Domains</title>
			</Head>

			<h5 className="fw-bold">
				Available Domains:
			</h5>

			{/* Domains table */}
			<div className="table-responsive">
				<table className="table table-bordered text-nowrap">
					<tbody>

						{domainList}

						{/* Add new domain form */}
						<tr className="align-middle">
							<td className="col-1 text-center" colSpan="3">
								<form className="d-flex" onSubmit={addDomain} action="/forms/domain/add" method="post">
									<input type="hidden" name="_csrf" value={csrf} />
									<input className="btn btn-success" type="submit" value="+" />
									<input className="form-control mx-3" type="text" name="domain" placeholder="domain" required />
													
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
