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
			API.getDomains(dispatch, setError, router);
		}
	}, [state.user, router]);

	if (!state.user) {
		return (
			<>
				Loading...
				{error && <ErrorAlert error={error} />}
			</>
		);
	}

	const { user, csrf } = state;

	async function addDomain(e) {
		e.preventDefault();
		await API.addDomain({ _csrf: csrf, domain: e.target.domain.value }, dispatch, setError, router);
		await API.getDomains(dispatch, setError, router);
	}

	async function deleteDomain(e) {
		e.preventDefault();
		await API.deleteDomain({ _csrf: csrf, domain: e.target.domain.value }, dispatch, setError, router);
		await API.getDomains(dispatch, setError, router);
	}

	const domainList = user.domains.map((d, i) => {
		//TODO: refactor, to component
		return (
			<tr key={i} className="align-middle">
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

			{error && <ErrorAlert error={error} />}

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
