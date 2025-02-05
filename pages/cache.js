import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import InfoAlert from '../components/InfoAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import withAuth from '../components/withAuth.js';

function Cache(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [message, setMessage] = useState();
	const [isPrefixPurge, setIsPrefixPurge] = useState(false);

	useEffect(() => {
		if (!state.user) {
			API.getAccount(dispatch, setError, router);
		}
	}, [state.user, state.maps, router]);

	async function cachePurge(e) {
		e.preventDefault();
		setMessage(null);
		setError(null);
		await API.cachePurge({
			_csrf: csrf,
			url: e.target.url.value,
			ban: isPrefixPurge,
		}, (res) => {
			console.log(res);
			setMessage(`Purged ${e.target.url.value}${isPrefixPurge ? '*' : ''}`);
		}, setError, router);
		NProgress.done(true);
	}

	async function handleDomainCachePurge(e) {
		e.preventDefault();
		setMessage(null);
		setError(null);
		const selectedURL = e.target.domain.value;
		const domain = new URL(selectedURL).hostname;
		if (confirm(`Are you sure you want to purge all cached objects for "${domain}"?`)) {
			setError(null);
			await API.cachePurge({
				_csrf: csrf,
				url: selectedURL,
				ban: true,
			}, () => setMessage(`Purging all cached objects for "${domain}". This may take a short time to take effect.`), setError, router);
			NProgress.done(true);
		}
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

			<div className='list-group mb-2'>
				{/* Domain Cache Purge Form */}
				<div className='list-group-item py-3'>
					<div className='mb-2'>Purge all cached objects for a domain:</div>
					<form onSubmit={handleDomainCachePurge} action='/forms/cache/domain-purge' method='post'>
						<input type='hidden' name='_csrf' value={csrf} />
						<div className='d-flex gap-3'>
							<select
								className='form-select'
								name='domain'
								required
							>
								<option value=''>Select Domain</option>
								{state.user?.domains.map(domain => (
									<option key={domain} value={`https://${domain}/`}>{domain}</option>
								))}
							</select>
							<button className='btn btn-sm btn-danger w-25' type='submit'>
								Purge All
							</button>
						</div>
					</form>
				</div>
			</div>

			<div className='list-group'>
				{/* URL Cache Purge Form */}
				<div className='list-group-item py-3'>
					<div className='mb-2'>Purge a single URL or URL prefix:</div>
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
							<div className='form-check align-self-center w-25'>
								<input
									className='form-check-input'
									type='checkbox'
									id='isPrefixPurge'
									checked={isPrefixPurge}
									onChange={() => setIsPrefixPurge(!isPrefixPurge)}
								/>
								<label className='form-check-label' htmlFor='isPrefixPurge'>
									Purge Prefix
								</label>
							</div>
							<button className='btn btn-sm btn-primary w-25' type='submit'>
								Purge
							</button>
						</div>
					</form>
				</div>
			</div>

			{message && <span className='mx-2'><InfoAlert>{message}</InfoAlert></span>}

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* back to account */}
			<BackButton to='/dashboard' />

		</>
	);

}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale}) {
	return { props: JSON.parse(JSON.stringify(res.locals.data||{})) };
}

export default withAuth(Cache);
vv;
