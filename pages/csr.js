import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';

export default function Csr(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getAccount(dispatch, setError, router);
		}
	}, [state.user, state.maps, router]);

	async function verifyCSR(e) {
		e.preventDefault();
		setError(null);
		await API.verifyCSR({
			_csrf: csrf,
			csr: e.target.csr.value,
			json: true,
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

	const { user, csrf, csr } = state;

	useEffect(() => {
		if (user && !user.onboarding) {
			router.push('/onboarding');
		}
	}, []);

	return (
		<>

			<Head>
				<title>Certificate Signing Request</title>
			</Head>

			<h5 className='fw-bold'>
				Certificate Signing Request:
			</h5>

			<div className='list-group'>
				<div className='list-group-item'>
					<p>
						To generate a certificate signing request for your domain and/or subdomain(s):
						<div>
							<code>
								{'openssl req -newkey rsa:4096 -new -nodes -subj "/CN='}<strong>yourdomain.com</strong>{'/OU=OrganisationUnit/O=Organisation/L=Locality/ST=St/C=Co" -sha256 -extensions v3_req -reqexts SAN -keyout origin.key -out origin.csr -config <(cat /etc/ssl/openssl.cnf \<\(printf "[SAN]\\nsubjectAltName=DNS:'}<strong>yourdomain.com</strong>{',DNS:'}<strong>www.yourdomain.com</strong>{'"))'}
							</code>
						</div>
					</p>
				</div>

				{/* Verify CSR form */}
				<div className='list-group-item pb-3'>
					<form onSubmit={verifyCSR} action='/forms/csr/verify' method='post'>
						<input type='hidden' name='_csrf' value={csrf} />
						<div className='mb-2'>
							<label className='form-label w-100'>Paste your origin.csr file here:
								<textarea
									className='form-control'
									name='csr'
									placeholder={'-----BEGIN CERTIFICATE REQUEST-----\n...'}
									rows={4}
									required />
							</label>
						</div>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-1' width='16' height='16' />
							Verify CSR
						</button>
					</form>
				</div>

				{csr && <div className='list-group-item'>
					<div className='mb-2'>
						<label className='form-label w-100'>Here&apos;s your certificate:
							<textarea
								className='form-control'
								name='csr'
								value={csr}
								rows={10}
								readOnly
								required />
						</label>
					</div>
				</div>}
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

