import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import SearchFilter from '../components/SearchFilter.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import { wildcardMatches } from '../util.js';
import withAuth from '../components/withAuth.js';

function Domains(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState('');

	useEffect(() => {
		if (!state.user || !state.certs || !state.user.domains) {
			API.getDomains(dispatch, setError, router);
		}
	}, []);

	if (!state.user || state.certs == null || state.user.domains == null) {
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

	const { user, csrf, certs } = state;

	async function addDomain(e) {
		e.preventDefault();
		setError(null);
		await API.addDomain({ _csrf: csrf, domain: e.target.domain.value }, dispatch, setError, router);
		await API.getDomains(dispatch, setError, router);
		e.target.reset();
	}

	async function deleteDomain(_csrf, domain) {
		setError(null);
		await API.deleteDomain({ _csrf, domain }, dispatch, setError, router);
		await API.getDomains(dispatch, setError, router);
	}

	const domainList = [];
	const subdomainList = [];
	user.domains
		//.sort((a, b) => a.localeCompare(b))
		.filter(d => (!filter || filter.length === 0) || (d && d.includes(filter)))
		.forEach((d, i) => {
			const domainCert = certs.find(c => c.subject === d || c.altnames.includes(d));
			const wildcardCert = certs.find(c => {
				return ((c.subject.startsWith('*') && wildcardMatches(d, c.subject))
					|| c.altnames.some(an => an.startsWith('*') && wildcardMatches(d, an)));
			});
			const isSubdomain = d.split('.').length > 2;
			let daysRemaining;
			if (domainCert || wildcardCert) {
				const certDate = (domainCert || wildcardCert).date;
				const creation = new Date(certDate);
				const expiry = creation.setDate(creation.getDate() + 90);
				daysRemaining = (Math.floor(expiry - Date.now()) / 86400000).toFixed(1);
			}
			const tableRow = (
				<tr key={i} className='align-middle'>
					<td className='text-left' style={{ width: 0 }}>
						<a className='btn btn-sm btn-danger' onClick={() => {
							if (window.confirm(`Are you sure you want to delete "${d}"?`)) {
								deleteDomain(csrf, d);
							}
						}}>
							<i className='bi-trash-fill pe-none' width='16' height='16' />
						</a>
						{!isSubdomain && <Link href={`/dns/${d}`} passHref className='btn btn-sm btn-primary ms-2'>
							<i className='bi-pencil pe-none' width='16' height='16' />
						</Link>}
					</td>
					<td>
						{d}
						{(domainCert || wildcardCert) && <a target='_blank' rel='noreferrer' href={`https://${d}`}>
							<i className='bi-box-arrow-up-right pe-none ms-1' width='12' height='12' style={{ fontSize: '0.8rem' }} />
						</a>}
					</td>
					<td>
						{(domainCert || wildcardCert)
							? <Link href={`/certs#${(domainCert || wildcardCert).storageName}`} className='text-success'>
								<i className={`${wildcardCert ? 'bi-asterisk' : 'bi-lock-fill'} pe-none me-2`} width='16' height='16' />
								{(domainCert || wildcardCert).storageName}
								{wildcardCert ? <small>{' '}(Wildcard)</small> : ''}
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
			isSubdomain ? subdomainList.push(tableRow) : domainList.push(tableRow);
		});

	return (
		<>

			<Head>
				<title>Domains</title>
			</Head>

			<h5 className='fw-bold'>
				Domains:
			</h5>

			<SearchFilter filter={filter} setFilter={setFilter} />

			{/* Domains table */}
			<div className='table-responsive round-border'>
				<table className='table text-nowrap'>
					<tbody>

						{domainList && domainList.length > 0 && <tr className='align-middle'>
							<th />
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
						{subdomainList.length > 0 && <tr className='align-middle'>
							<th colSpan='4'>
								Subdomains:
							</th>
						</tr>}
						{subdomainList}

						{/* Add new domain form */}
						<tr className='align-middle'>
							<td className='col-1 text-center' colSpan='4'>
								<form className='d-flex' onSubmit={addDomain} action='/forms/domain/add' method='post'>
									<input type='hidden' name='_csrf' value={csrf} />
									<button className='btn btn-sm btn-success' type='submit'>
										<i className='bi-plus-lg pe-none' width='16' height='16' />
									</button>
									<input className='form-control ms-3' type='text' name='domain' placeholder='domain e.g. example.com' required />
								</form>
							</td>
						</tr>

					</tbody>
				</table>
			</div>

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* back to account */}
			<BackButton to='/dashboard' />

		</>
	);

}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data||{})) };
}

export default withAuth(Domains);
