import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
			<div className="d-flex flex-column">
				{error && <ErrorAlert error={error} />}
				<div className="text-center mb-4">
					Loading...
				</div>
			</div>
		);
	}

	const { user, csrf, certs } = state;

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

	const domainList = user.domains
		.sort((a, b) => a.localeCompare(b))
		.map((d, i) => {
		//TODO: refactor, to component
		const domainCert = certs.find(c => c.subject === d || c.altnames.includes(d));
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
				<td>
					{domainCert
						? <span className="text-success"><i className="bi-lock-fill pe-none me-2" width="16" height="16" />{domainCert.storageName}</span>
						: <span className="text-danger"><i className="bi-exclamation-triangle-fill pe-none me-2" width="16" height="16" />No Certificate</span>}
				</td>
				<td className="col-1 text-center">
					{d.split('.').length < 2 && <Link href={`/dns/${d}`}>
						<a className="btn btn-outline-secondary">
							<i className="bi-card-list pe-none me-2" width="16" height="16" />
							DNS
						</a>
					</Link>}
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
				Your Domains:
			</h5>

			{/* Domains table */}
			<div className="table-responsive">
				<table className="table text-nowrap m-1">
					<tbody>

						<tr className="align-middle">
							<th className="col-1" />
							<th>
								Domain
							</th>
							<th>
								HTTPS Certificate
							</th>
							<th className="col-1">
								Edit DNS
							</th>
						</tr>

						{domainList}

						{/* Add new domain form */}
						<tr className="align-middle">
							<td className="col-1 text-center" colSpan="4">
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

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
}
