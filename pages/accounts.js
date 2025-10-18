import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as API from '../api.js';
import ErrorAlert from '../components/ErrorAlert.js';
import withAuth from '../components/withAuth.js';

function AccountsPage(props) {
	const router = useRouter();
	const [state, setState] = useState(props);
	const [error, setError] = useState();
	const [deleting, setDeleting] = useState(null);

	useEffect(() => {
		API.getAccounts(setState, setError, router);
	}, []);

	if (!state || !state.originalUser) {
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

	const { accounts = [], csrf } = state;

	async function handleDelete(accountId) {
		if (!confirm(`Delete account "${accountId}"?`)) {
			return;
		}
		setDeleting(accountId);
		await API.deleteAccount({ _csrf: csrf, accountId }, setState, setError, router);
		await API.getAccounts(setState, setError, router);
		setDeleting(null);
	}

	return (
		<>
			<Head>
				<title>Accounts</title>
			</Head>

			<h5 className='fw-bold'>Accounts</h5>

			{error && <ErrorAlert error={error} />}

			<div className='table-responsive round-border mb-2'>
				<table className='table text-nowrap'>
					<thead>
						<tr className='align-middle'>
							<th />
							<th>Username</th>
							<th>Email</th>
							<th>Domains</th>
							<th>Email Verified</th>
							<th>Billing</th>
							<th>Max Domains</th>
							<th>Active</th>
						</tr>
					</thead>
					<tbody>
						{accounts.map((a, idx) => {
							const domainArray = a.domains || [];
							const domainsContent = domainArray.length > 0
								? domainArray.map((d, i) => <div key={i}>{d}</div>)
								: <div className='text-secondary'><i className='bi-dash-lg pe-none' /></div>;
							const domainsCell = domainArray.length > 3
								? <details><summary>Expand ({domainArray.length})</summary>{domainsContent}</details>
								: domainsContent;

							const emailVerified = a.emailVerified === true || a.emailVerified === 'true'
								? <span className='text-success'><i className='bi-check-lg pe-none' width='16' height='16' /></span>
								: <span className='text-secondary'><i className='bi-dash-lg pe-none' width='16' height='16' /></span>;

							const billing = a.billing || {};
							const capabilities = (billing.capabilities || []).length > 0
								? billing.capabilities.join(', ')
								: <span className='text-secondary'><i className='bi-dash-lg pe-none' /></span>;

							const active = a.inactive ? <span className='text-secondary'>No</span> : <span className='text-success'>Yes</span>;

							return (
								<tr className='align-middle' key={idx}>
									<td className='text-left'>
										{/*<a className='btn btn-sm btn-primary me-2' onClick={() => {}} role='button'>
											<i className='bi-pencil-fill pe-none' width='16' height='16' />
										</a>*/}
										<a className='btn btn-sm btn-danger' onClick={() => handleDelete(a._id)} role='button' disabled={deleting === a._id}>
											<i className='bi-trash-fill pe-none' width='16' height='16' />
										</a>
									</td>
									<td>{a._id}</td>
									<td>{a.email || ''}</td>
									<td>{domainsCell}</td>
									<td>{emailVerified}</td>
									<td>
										<div>Price: {typeof billing.price !== 'undefined' ? billing.price : '-'}</div>
										<div>{billing.description || '-'}</div>
										<div>Capabilities: {capabilities}</div>
									</td>
									<td>{typeof billing.maxDomains !== 'undefined' ? billing.maxDomains : '-'}</td>
									<td>{active}</td>
								</tr>
							);
						})}
						{accounts.length === 0 && (
							<tr><td colSpan='8'>No accounts</td></tr>
						)}
					</tbody>
				</table>
			</div>
		</>
	);
}

export async function getServerSideProps({ res }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(AccountsPage);
