import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js'
import { useRouter } from 'next/router';
import { wildcardCheck } from '../util.js';

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
					<div className="spinner-border mt-5" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	const { user, csrf, certs } = state;

	async function addDomain(e) {
		e.preventDefault();
		setError(null);
		await API.addDomain({ _csrf: csrf, domain: e.target.domain.value }, dispatch, setError, router);
		await API.getDomains(dispatch, setError, router);
		e.target.reset();
	}

	async function deleteDomain(csrf, domain) {
		setError(null);
		await API.deleteDomain({ _csrf: csrf, domain }, dispatch, setError, router);
		await API.getDomains(dispatch, setError, router);
	}

	const domainList = [];
	const subdomainList = [];
	user.domains
		//.sort((a, b) => a.localeCompare(b))
		.forEach((d, i) => {
		//TODO: refactor, to component
		const domainCert = certs.find(c => c.subject === d || c.altnames.includes(d));
		const wildcardCert = certs.find(c => {
			return ((c.subject.startsWith('*') && wildcardCheck(c.subject, [d]))
				|| c.altnames.some(an => an.startsWith('*') && wildcardCheck(an, [d])));
		});
		const isSubdomain = d.split('.').length > 2;
		const tableRow = (
			<tr key={i} className="align-middle">
				<td className="text-left" style={{width:0}}>
					<input onClick={() => deleteDomain(csrf, d)} className="btn btn-danger" type="button" value="×" />
				</td>
				<td>
					{d}
				</td>
				<td>
					{(domainCert || wildcardCert)
						? <span className="text-success">
							<i className={`${wildcardCert ? 'bi-asterisk' : 'bi-lock-fill'} pe-none me-2`} width="16" height="16" />
							{(domainCert||wildcardCert).storageName}
							{wildcardCert ? <small>{' '}(Wildcard)</small> : ''}
						</span>
						: <span>
							No Certificate
						</span>}
				</td>
				<td className="col-1 text-center">
					{!isSubdomain && <Link href={`/dns/${d}`}>
						<a className="btn btn-outline-secondary">
							<i className="bi-card-list pe-none me-2" width="16" height="16" />
							DNS
						</a>
					</Link>}
				</td>
			</tr>
		);
		isSubdomain ? subdomainList.push(tableRow) : domainList.push(tableRow)
	});

	return (
		<>

			<Head>
				<title>Domains</title>
			</Head>

			<h5 className="fw-bold">
				Domains:
			</h5>

			{/* Domains table */}
			<div className="table-responsive">
				<table className="table text-nowrap">
					<tbody>

						<tr className="align-middle">
							<th/>
							<th>
								Domain
							</th>
							<th>
								HTTPS Certificate
							</th>
							<th>
								Edit DNS
							</th>
						</tr>

						{domainList}
						{subdomainList.length > 0 && <tr className="align-middle">
							<th colSpan="4">
								Subdomains:
							</th>
						</tr>}
						{subdomainList}

						{/* Add new domain form */}
						<tr className="align-middle">
							<td className="col-1 text-center" colSpan="4">
								<form className="d-flex" onSubmit={addDomain} action="/forms/domain/add" method="post">
									<input type="hidden" name="_csrf" value={csrf} />
									<input className="btn btn-success" type="submit" value="+" />
									<input className="form-control ms-3" type="text" name="domain" placeholder="domain" required />
								</form>
							</td>
						</tr>

					</tbody>
				</table>
			</div>

			{error && <ErrorAlert error={error} />}

			{/* back to account */}
			<BackButton to="/account" />

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
}
