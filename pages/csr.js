import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import withAuth from '../components/withAuth.js';
import NProgress from 'nprogress';

function Csr(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [mainDomain, setMainDomain] = useState('');
	const [altNames, setAltNames] = useState('');
	const [opensslCommand, setOpensslCommand] = useState('');
	const { csrf, csr } = state || {};

	useEffect(() => {
		if (!state.user) {
			API.getAccount(dispatch, setError, router);
		}
	}, [state.user, state.maps, router]);

	useEffect(() => {
		// Generate OpenSSL command when inputs change
		const altNamesArray = altNames.split('\n').filter(name => name.trim() !== '');
		const altNamesFormatted = altNamesArray.map(name => `DNS:${name.trim()}`).join(',');
		const command = `openssl req -newkey rsa:4096 -new -nodes -subj "/CN=${mainDomain}/OU=OrganisationUnit/O=Organisation/L=Locality/ST=St/C=Co" -sha256 -extensions v3_req -reqexts SAN -keyout origin.key -out origin.csr -config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\\nsubjectAltName=${altNamesFormatted ? `DNS:${mainDomain},${altNamesFormatted}` : `DNS:${mainDomain}`}"))`;
		setOpensslCommand(command);
	}, [mainDomain, altNames]);

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
					<p>To generate a certificate signing request for your domain and/or subdomain(s), fill out the details below:</p>
					<div className='mb-2'>
						<label className='form-label w-100'>Subject (e.g., yourdomain.com):
							<input
								type='text'
								className='form-control'
								placeholder='yourdomain.com'
								value={mainDomain}
								onChange={e => setMainDomain(e.target.value)}
								required
							/>
						</label>
					</div>
					<div className='mb-2'>
						<label className='form-label w-100'>Altname(s):
							<textarea
								className='form-control'
								placeholder={'www.yourdomain.com\r\ndev.yourdomain.com\r\netc...'}
								rows={4}
								value={altNames}
								onChange={e => setAltNames(e.target.value)}
							/>
						</label>
					</div>
					<div className='mb-2'>
						<label className='form-label w-100'>Run the generated OpenSSL command to get your origin cert files:
							<textarea
								className='form-control'
								value={opensslCommand}
								readOnly
								rows={4}
							/>
						</label>
					</div>
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

			<BackButton to='/dashboard' />

		</>
	);

}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(Csr);
