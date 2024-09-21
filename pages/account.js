import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MapLink from '../components/MapLink.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';

export default function Account(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		API.getAccount(dispatch, setError, router);
	}, []);

	let innerData;

	const { user, maps, globalAcl, csrf } = state || {};

	useEffect(() => {
		if (user && !user.onboarding) {
			router.push('/onboarding');
		}
	}, []);

	if (state && state.user && state.maps != null) {

		// Links to each map and bubble/pill for map counts
		const mapLinks = maps.map((map, i) => <MapLink key={i} map={map} />);

		async function toggleGlobal(e) {
			e.preventDefault();
			await API.globalToggle({ _csrf: csrf },dispatch, setError, router);
			await API.getAccount(dispatch, setError, router);
		}

		innerData = (
			<>

				{/* Global overide */}
				<div className='list-group-item d-flex align-items-center'>
					<div className='ms-2 me-auto d-flex align-items-center gap-2'>
						<span className='fw-bold'>
							Global Override
						</span>
					</div>
					<form onSubmit={toggleGlobal} action='/forms/global/toggle' method='post' className='me-2'>
						<input type='hidden' name='_csrf' value={csrf} />
						<input className='btn btn-sm btn-primary' type='submit' value='Toggle' />
					</form>
					<div className={`badge rounded-pill bg-${globalAcl?'success':'dark'}`}>
						{globalAcl?'ON':'OFF'}
					</div>
				</div>

				{/* Downs ips */}
				<Link href='/down' className='list-group-item list-group-item-action d-flex align-items-start'>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>
								Downed IPs
							<span className='fw-normal'>
								{' '}- IPs that are forced down for maintenance
							</span>
						</div>
					</div>
				</Link>

				{/* Domains */}
				<Link href='/domains' className='list-group-item list-group-item-action d-flex align-items-start'>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>
								Domains
							<span className='fw-normal'>
								{' '}- Domains you have permission over
							</span>
						</div>
					</div>
					<div className='badge bg-primary rounded-pill'>
						{user.domains.filter(x => x.split('.').length <= 2).length}
					</div>
				</Link>

				{/* HTTPS certificates */}
				<Link href='/certs' className='list-group-item list-group-item-action d-flex align-items-start'>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>
								HTTPS Certificates
							<span className='fw-normal'>
								{' '}- Generated certs for your domains
							</span>
						</div>
					</div>
					<div className='badge bg-primary rounded-pill'>
						{user.numCerts}
					</div>
				</Link>

				{/* Origin CSR */}
				<Link href='/csr' className='list-group-item list-group-item-action d-flex align-items-start'>
					<div className='ms-2 me-auto'>
						<div className='fw-bold'>
								Origin CSR
							<span className='fw-normal'>
								{' '}- Sign CSR to get certs for your origins
							</span>
						</div>
					</div>
				</Link>

				{/* Map links */}
				{mapLinks}

			</>
		);

	} else {

		innerData = (
			<div className='d-flex flex-column'>
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
				<title>Account</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className='fw-bold'>
				Account:
			</h5>

			<div className='list-group col-sm-12 col-xl-8 mx-auto'>

				{innerData}

			</div>

		</>
	);
};

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale}) {
	return { props: res.locals.data };
};
