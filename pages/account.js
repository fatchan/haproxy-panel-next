import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as API from '../api.js';
import ErrorAlert from '../components/ErrorAlert.js';

export default function AccountPage(props) {
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	const { user } = state || {};

	useEffect(() => {
		API.getAccount(dispatch, setError, router);
	}, []);

	if (!state.user) {
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

	return (
		<>
			<Head>
				<title>Account Details</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='container col-sm-12 col-xl-8 mx-auto'>
				<h5 className='fw-bold mb-4'>Account Information</h5>

				<div className='card mb-4'>
					<div className='card-body'>
						<h6 className='card-title'>Username</h6>
						<p className='card-text'>{user.username}</p>
					</div>
				</div>

				<div className='card mb-4'>
					<div className='card-body'>
						<h6 className='card-title'>Email</h6>
						<p className='card-text'>{user.email}</p>
					</div>
				</div>

				<div className='card mb-4'>
					<div className='card-body'>
						<h6 className='card-title'>Subscription</h6>
						<span className='card-text'>Plan: {user.billing.description}</span>
						<p className='card-text'>Price: ${(user.billing.price/100).toFixed(2)} per month</p>
					</div>
				</div>

				<div className='card mb-4'>
					<div className='card-body'>
						<h6 className='card-title'>Domains</h6>
						<p className='card-text'>
							<strong>{user.domains.length}</strong> Domains / <strong>{user.maxDomains ? user.maxDomains : '∞'}</strong> Max
						</p>
					</div>
				</div>

			</div>
		</>
	);
}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: res.locals.data };
}
