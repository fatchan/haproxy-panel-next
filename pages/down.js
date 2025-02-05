import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import withAuth from '../components/withAuth.js';

function Down(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getDownIps(dispatch, setError, router);
		}
	}, [state.user, state.maps, router]);

	async function setDownIps(e) {
		e.preventDefault();
		setError(null);
		await API.setDownIps({
			_csrf: csrf,
			ips: e.target.ips.value.split(/\r?\n/).map(x => x.trim()),
		}, dispatch, setError, router);
		NProgress.done(true);
	}

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

	const { csrf, ips } = state;

	return (
		<>

			<Head>
				<title>Downed IPs</title>
			</Head>

			<h5 className='fw-bold'>
				Downed IPs:
			</h5>

			<div className='list-group'>

				{/* Downed IPs form */}
				<div className='list-group-item pb-3'>
					<form onSubmit={setDownIps} action='/forms/down' method='post'>
						<input type='hidden' name='_csrf' value={csrf} />
						<div className='mb-2'>
							<label className='form-label w-100'>Enter IPs to force fail health checking:
								<textarea
									className='form-control'
									name='ips'
									placeholder={'12.34.56.78\n...'}
									rows={5}
									defaultValue={ips.join('\n')}
								/>
							</label>
						</div>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-floppy pe-1' width='16' height='16' />
							Save
						</button>
					</form>
				</div>

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

export default withAuth(Down);
