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
	const [filter, setFilter] = useState('');

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
		.filter(d => d.includes(filter))
		.forEach((d, i) => {
		//TODO: refactor, to component
		const domainCert = certs.find(c => c.subject === d || c.altnames.includes(d));
		const wildcardCert = certs.find(c => {
			return ((c.subject.startsWith('*') && wildcardCheck(c.subject, [d]))
				|| c.altnames.some(an => an.startsWith('*') && wildcardCheck(an, [d])));
		});
		const isSubdomain = d.split('.').length > 2;
		let daysRemaining;
		if (domainCert || wildcardCert) {
			const certDate = (domainCert || wildcardCert).date;
			const creation = new Date(certDate);
			const expiry = creation.setDate(creation.getDate()+90);
			daysRemaining = (Math.floor(expiry - Date.now()) / 86400000).toFixed(1);
		}
		const tableRow = (
			<tr key={i} className="align-middle">
				<td className="text-left" style={{width:0}}>
					<a className="btn btn-sm btn-danger" onClick={() => {
						if (window.confirm(`Are you sure you want to delete "${d}"?`)) {
							deleteDomain(csrf, d);
						}
					}}>
						<i className="bi-trash-fill pe-none" width="16" height="16" />
					</a>
					{!isSubdomain && <Link href={`/dns/${d}`} passHref>
						<a className="btn btn-sm btn-primary ms-2">
							<i className="bi-pencil pe-none" width="16" height="16" />
						</a>
					</Link>}
				</td>
				<td>
					{d}
				</td>
				<td>
					{(domainCert || wildcardCert)
						? <Link href={`/certs#${(domainCert||wildcardCert).storageName}`}>
							<a className="text-success">
								<i className={`${wildcardCert ? 'bi-asterisk' : 'bi-lock-fill'} pe-none me-2`} width="16" height="16" />
								{(domainCert||wildcardCert).storageName}
								{wildcardCert ? <small>{' '}(Wildcard)</small> : ''}
							</a>
						</Link>
						: <span>
							No Certificate
						</span>}
				</td>
				<td suppressHydrationWarning={true}>
					{daysRemaining ? `${daysRemaining} days` : '-'}
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

			<div className="input-group mb-3">
			  <div className="input-group-prepend">
			    <span className="input-group-text" style={{ borderRadius: '5px 0 0 5px' }}>
					<i className="bi bi-search" />
			    </span>
			  </div>
			  <input onChange={e => setFilter(e.target.value||'')} type="text" className="form-control" placeholder="Search" />
			</div>
			
			{/* Domains table */}
			<div className="table-responsive">
				<table className="table text-nowrap">
					<tbody>

						{domainList && domainList.length > 0 && <tr className="align-middle">
							<th/>
							<th>
								Domain
							</th>
							<th>
								HTTPS Certificate
							</th>
							<th>
								Certificate Expires
							</th>
						</tr>}

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
									<button className="btn btn-sm btn-success" type="submit">
										<i className="bi-plus-lg pe-none" width="16" height="16" />
									</button>
									<input className="form-control ms-3" type="text" name="domain" placeholder="domain e.g. example.com" required />
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
