import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import { wildcardCheck, wildcardMatches } from '../util.js';

const statusColors = {
	'cancelled': 'secondary',
	'pending': 'primary',
	'paid': 'success',
	'unpaid': 'warning',
	'overdue': 'danger',
	'other': 'info',
};

export default function Billing(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.invoices) {
			API.getBilling(dispatch, setError, router);
		}
	}, []);

	if (!state.invoices) {
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

	const { invoices } = state;

	return (
		<>

			<Head>
				<title>Billing</title>
			</Head>

			<h5 className='fw-bold'>
				Invoices:
			</h5>
			
			{/* Domains table */}
			<div className='table-responsive round-shadow'>
				<table className='table text-nowrap'>
					<tbody>

						<tr className='align-middle'>
							<th>
								Description
							</th>
							<th>
								Date
							</th>
							<th>
								Amount
							</th>
							<th>
								Status
							</th>
						</tr>
						
						{invoices.map(inv => (<tr key={inv._id} className='align-middle'>
							<td>
								{inv.description}
							</td>
							<td suppressHydrationWarning={true}>
								{new Date(inv.date).toLocaleString()}
							</td>
							<td>
								${(inv.amount/100).toFixed(2)}
							</td>
							<td>
								<span className={`badge rounded-pill text-bg-${statusColors[inv.status]} text-uppercase`}>
									{inv.status}
								</span>
							</td>
						</tr>))}

					</tbody>
				</table>
			</div>

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* back to account */}
			<BackButton to='/account' />

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: res.locals.data };
}

