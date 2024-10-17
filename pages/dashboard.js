import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';

export default function DashboardHome(props) {
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	const { globalAcl, csrf, user } = state || {};
	const domainCount = user?.domains?.length || 0;

	async function toggleGlobal(e) {
		e.preventDefault();
		await API.globalToggle({ _csrf: csrf }, dispatch, setError, router);
		await API.getAccount(dispatch, setError, router);
	}

	useEffect(() => {
		API.getAccount(dispatch, setError, router);
	}, []);

	if (!state.user || state.user.domains == null) {
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
				<title>Dashboard Home</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className='fw-bold'>Dashboard Home:</h5>

			<div className='container col-sm-12 col-xl-8 mx-auto'>

				{/* Global Override Card */}
				<div className='card mb-4'>
					<div className='card-body d-flex align-items-center'>
						<div className='ms-2 me-auto d-flex align-items-center gap-2'>
							<span className='fw-bold'>Global Override</span>
						</div>
						<form onSubmit={toggleGlobal} action='/forms/global/toggle' method='post' className='me-2 d-flex align-items-center'>
							<input type='hidden' name='_csrf' value={csrf} />
							<div className='form-check form-switch'>
								<input
									className='form-check-input'
									type='checkbox'
									role='switch'
									id='globalSwitch'
									name='globalToggle'
									checked={globalAcl}
									onChange={toggleGlobal}
								/>
								<label className='form-check-label' htmlFor='globalSwitch'></label>
							</div>
						</form>
						<div className={`badge rounded-pill bg-${globalAcl ? 'success' : 'dark'}`}>
							{globalAcl ? 'ON' : 'OFF'}
						</div>
					</div>
				</div>

				{/* Grid layout for links */}
				<div className='row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 text-center'>
					{/* DNS */}
					<div className='col'>
						<Link href='/domains' className='card text-decoration-none bg-light'>
							<div className='card-body d-flex flex-column justify-content-center align-items-center p-4' style={{ minHeight: '200px' }}>
								<i className='bi bi-cloud fs-2'></i>
								<h5 className='card-title'>DNS</h5>
								<p className='card-text'>
									<small className='alert alert-info text-uppercase p-0 px-1 ms-2' style={{ fontSize: 12 }} role='alert'>
										{domainCount} Domains
									</small>
								</p>
							</div>
						</Link>
					</div>

					{/* Backends */}
					<div className='col'>
						<Link href='/map/hosts' className='card text-decoration-none bg-light'>
							<div className='card-body d-flex flex-column justify-content-center align-items-center p-4' style={{ minHeight: '200px' }}>
								<i className='bi bi-hdd-network fs-2'></i>
								<h5 className='card-title'>Backends</h5>
							</div>
						</Link>
					</div>

					{/* HTTPS Certificates */}
					<div className='col'>
						<Link href='/certs' className='card text-decoration-none bg-light'>
							<div className='card-body d-flex flex-column justify-content-center align-items-center p-4' style={{ minHeight: '200px' }}>
								<i className='bi bi-file-earmark-lock fs-2'></i>
								<h5 className='card-title'>HTTPS Certificates</h5>
								<p className='card-text'>
									<small className='alert alert-info text-uppercase p-0 px-1 ms-2' style={{ fontSize: 12 }} role='alert'>
										{user.numCerts} Certs
									</small>
								</p>
							</div>
						</Link>
					</div>

					{/* Billing */}
					<div className='col'>
						<Link href='/billing' className='card text-decoration-none bg-light'>
							<div className='card-body d-flex flex-column justify-content-center align-items-center p-4' style={{ minHeight: '200px' }}>
								<i className='bi bi-credit-card fs-2'></i>
								<h5 className='card-title'>Billing</h5>
							</div>
						</Link>
					</div>

					{/* Statistics Card */}
					<div className='col'>
						<Link href='/stats' className='card text-decoration-none bg-light'>
							<div className='card-body d-flex flex-column justify-content-center align-items-center p-4' style={{ minHeight: '200px' }}>
								<i className='bi bi-graph-up fs-2'></i>
								<h5 className='card-title'>Statistics</h5>
								<small className='alert alert-warning text-uppercase p-0 px-1 ms-2' style={{ fontSize: 12 }} role='alert'>
									beta
								</small>
							</div>
						</Link>
					</div>

					{/* Downed IPs */}
					<div className='col'>
						<Link href='/down' className='card text-decoration-none bg-light'>
							<div className='card-body d-flex flex-column justify-content-center align-items-center p-4' style={{ minHeight: '200px' }}>
								<i className='bi bi-arrow-down-square fs-2'></i>
								<h5 className='card-title'>Downed IPs</h5>
							</div>
						</Link>
					</div>

				</div>
			</div>
		</>
	);
}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: res.locals.data };
}
