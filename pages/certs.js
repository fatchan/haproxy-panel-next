import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js'
import { getApproxSubject } from '../util.js'
import { useRouter } from 'next/router';

export default function Certs(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getCerts(dispatch, setError, router)
				.then(() => {
					setTimeout(() => {
						location.hash = location.hash;
					}, 10);
				});
		}
	}, [state.user, router]);

	if (!state.user) {
		return (
			<div className="d-flex flex-column">
				{error && <ErrorAlert error={error} />}
				<div className="text-center mb-4">
					<div className="spinner-border mt-5" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	const { user, csrf, dbCerts, clusterCerts } = state;

	if (user && !user.onboarding) {
		router.push('/onboarding');
	}

	async function addCert(e) {
		e.preventDefault();
		try {
			setError(null);
			await API.addCert({
				_csrf: csrf,
				subject: e.target.subject.value,
				altnames: e.target.altnames.value.split(',').map(x => x.trim()),
				email: e.target.email.value,
			}, dispatch, setError, router);
			e.target.reset();
		} catch(err) {
			console.warn(err);
			await new Promise(res => setTimeout(res, 10000));
		}
		await API.getCerts(dispatch, setError, router);
	}

	async function deleteCert(csrf, subject, storageName) {
		setError(null);
		await API.deleteCert({
			_csrf: csrf,
			subject,
			storage_name: storageName,
		}, dispatch, setError, router);
		await API.getCerts(dispatch, setError, router);
	}

	async function uploadCert(csrf, domain) {
		try {
			setError(null);
			await API.uploadCert({
				_csrf: csrf,
				domain: domain
			}, dispatch, setError, router);
		} catch(err) {
			console.warn(err);
			await new Promise(res => setTimeout(res, 10000));
		}
		await API.getCerts(dispatch, setError, router);
	}

	const clusterOnlyCerts = clusterCerts
		.filter(c => !dbCerts.some(dc => dc.storageName === c.storage_name))
		.filter(c => c.storage_name !== 'server-cert.pem')
		.filter(c => c.storage_name !== '_00_server-cert.pem');
	const clusterOnlyCertList = clusterOnlyCerts.map((c, i) => {
		const approxSubject = getApproxSubject(c.storage_name);
		return (
			<tr id={c.storage_name} key={'clusterOnlyCertList'+i} className="align-middle">
				<td className="col-1 text-center">
					<a className="btn btn-sm btn-danger" onClick={() => deleteCert(csrf, approxSubject, c.storage_name)}>
						<i className="bi-trash-fill pe-none" width="16" height="16" />
					</a>
				</td>
				<td>
					{approxSubject || '-'}
				</td>
				<td>
					-
				</td>
				<td>
					-
				</td>
				<td>
					{c.storage_name || '-'}
				</td>
			</tr>
		);
	});

	const certList = dbCerts.map((d, i) => {
		//TODO: refactor, to component
		let creation = new Date(d.date);
		const expiry = creation.setDate(creation.getDate()+90);
		const daysRemaining = (Math.floor(expiry - Date.now()) / 86400000).toFixed(1);
		const inCluster = clusterCerts.some(c => c.storage_name === d.storageName);
		return (
			<tr id={d.storageName} key={'certList'+i} className="align-middle">
				<td className="text-left" style={{width:0}}>
					{inCluster
						? <a className="btn btn-sm btn-danger" onClick={() => deleteCert(csrf, (d.subject || d._id), d.storageName)}>
							<i className="bi-trash-fill pe-none" width="16" height="16" />
						</a>
						: (<>
							<a className="btn btn-sm btn-warning" onClick={() => uploadCert(csrf, (d.subject || d._id))}>
								<i className="bi-cloud-upload pe-none" width="16" height="16" />
							</a>
							<a className="btn btn-sm btn-warning ms-2" onClick={() => deleteCert(csrf, (d.subject || d._id))}>
								<i className="bi-trash-fill pe-none" width="16" height="16" />
							</a>
						</>)
					}
				</td>
				<td>
					{d.subject || '-'}
				</td>
				<td>
					<textarea
						className="w-100"
						style={{border:'none'}}
						readOnly
						cols={20}
						rows={Math.min(3, d.altnames.length)}
						defaultValue={d.altnames && d.altnames.join('\n') || '-'}
					/>
				</td>
				<td suppressHydrationWarning={true}>
					{expiry ? `${daysRemaining} days` : '-'}
				</td>
				<td>
					{d.storageName || '-'}
				</td>
			</tr>
		);
	});

	return (
		<>

			<Head>
				<title>Certificates</title>
			</Head>

			<h5 className="fw-bold">
				HTTPS Certificates:
			</h5>

			{/* Certs table */}
			<div className="table-responsive">
				<form className="d-flex" onSubmit={addCert} action="/forms/cert/add" method="post">
					<input type="hidden" name="_csrf" value={csrf} />
					<table className="table text-nowrap notaborder">
						<tbody>

							<tr className="align-middle">
								<th style={{width:0}} />
								<th>
									Subject
								</th>
								<th>
									Altname(s)
								</th>
								<th>
									Expires
								</th>
								<th>
									Storage Name
								</th>
							</tr>

							{certList}

							{clusterOnlyCerts && clusterOnlyCerts.length > 0 && (<>
								<tr className="align-middle">
									<th colSpan="5">
										Not in local DB:
									</th>
								</tr>
								{clusterOnlyCertList}
							</>)}

							{/* Add new cert form */}
							<tr className="align-middle">
								<td>
									<button className="btn btn-sm btn-success" type="submit">
										<i className="bi-plus-lg pe-none" width="16" height="16" />
									</button>
								</td>
								<td>
									<input className="form-control" type="text" name="subject" placeholder="domain.com" required />
								</td>
								<td>
									<input className="form-control" type="text" name="altnames" placeholder="www.domain.com,staging.domain.com,etc..." required />
								</td>
								<td colSpan="2">
									<input className="form-control" type="email" name="email" placeholder="optional expiry warning email address"  />
								</td>
							</tr>

						</tbody>
					</table>
				</form>
			</div>

			{error && <ErrorAlert error={error} />}

			{/* back to account */}
			<BackButton to="/account" />

		</>
	);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
};
