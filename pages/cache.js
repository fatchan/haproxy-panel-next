import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';

export default function Cache(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getAccount(dispatch, setError, router);
		}
	}, [state.user, state.maps, router]);

	async function cachePurge(e) {
		e.preventDefault();
		setError(null);
		await API.cachePurge({
			_csrf: csrf,
			url: e.target.url.value,
		}, null, setError, router);
		NProgress.done(true);
	}

	const { csrf } = state || {};

	return (
		<>

			<Head>
				<title>Cache Purge</title>
			</Head>

			<h5 className='fw-bold'>
				Cache Purge:
			</h5>

			<div className='list-group'>
				{/* Verify CSR form */}
				<div className='list-group-item py-3'>
					<form onSubmit={cachePurge} action='/forms/cache/purge' method='post'>
						<input type='hidden' name='_csrf' value={csrf} />
						<div className='d-flex gap-3'>
							<input
								type='text'
								className='form-control'
								name='url'
								placeholder='https://example.com/path/to/something.jpg'
								rows={4}
								required
							/>
							<button className='btn btn-sm btn-primary w-25' type='submit'>
								Purge
							</button>
						</div>
					</form>
				</div>
			</div>

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* back to account */}
			<BackButton to='/dashboard' />

		</>
	);

}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale}) {
	return { props: res.locals.data };
}

