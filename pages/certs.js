import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js'
import { useRouter } from 'next/router';

export default function Certs(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getCerts(dispatch, setError, router);
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

	async function addCert(e) {
		e.preventDefault();
		await API.addCert({
			_csrf: csrf,
			subject: e.target.subject.value,
			altnames: e.target.altnames.value.split(',').map(x => x.trim()),
		}, dispatch, setError, router);
		await API.getCerts(dispatch, setError, router);
	}

	async function deleteCert(csrf, subject, storageName) {
		await API.deleteCert({
			_csrf: csrf,
			subject,
			storage_name: storageName,
		}, dispatch, setError, router);
		await API.getCerts(dispatch, setError, router);
	}

	async function uploadCert(e) {
		e.preventDefault();
		await API.uploadCert({
			_csrf: csrf,
			domain: e.target.domain.value
		}, dispatch, setError, router);
		await API.getCerts(dispatch, setError, router);
	}

	const clusterOnlyCerts = clusterCerts
		.filter(c => !dbCerts.some(dc => dc.storageName === c.storage_name))
		.filter(c => c.storage_name !== 'server-cert.pem'); //no point showing this
	const clusterOnlyCertList = clusterOnlyCerts.map((c, i) => {
		const approxSubject = c.storage_name
			.replaceAll('_', '.')
			.substr(0, c.storage_name.length-4);
		return (
			<tr key={'clusterOnlyCertList'+i} className="align-middle">
				<td className="col-1 text-center">
					<input onClick={() => deleteCert(csrf, approxSubject, c.storage_name)} className="btn btn-danger" type="button" value="×" />
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
			<tr key={'certList'+i} className="align-middle">
				<td className="text-left" style={{width:0}}>
					{inCluster
						? <input onClick={() => deleteCert(csrf, (d.subject || d._id), d.storageName)} className="btn btn-danger" type="button" value="×" />
						: (<>
							<input onClick={() => uploadCert(csrf, (d.subject || d._id))} className="btn btn-warning mb-2" type="button" value="↑" />
							<input onClick={() => deleteCert(csrf, (d.subject || d._id))} className="btn btn-warning mb-2" type="button" value="×" />
						</>)
					}
				</td>
				<td>
					{d.subject || '-'}
				</td>
				<td>
					<textarea
						className="w-100"
						readOnly
						cols={20}
						rows={Math.min(3, d.altnames.length)}
						defaultValue={d.altnames && d.altnames.join('\n') || '-'}
					/>
				</td>
				<td>
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

			{error && <ErrorAlert error={error} />}

			<h5 className="fw-bold">
				HTTPS Certificates:
			</h5>

			{/* Certs table */}
			<div className="table-responsive">
				<form className="d-flex" onSubmit={addCert} action="/forms/cert/add" method="post">
					<input type="hidden" name="_csrf" value={csrf} />
					<table className="table text-nowrap">
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
									<input className="btn btn-success" type="submit" value="+" />
								</td>
								<td>
									<input className="form-control" type="text" name="subject" placeholder="domain.com" required />
								</td>
								<td>
									<input className="form-control" type="text" name="altnames" placeholder="www.domain.com,staging.domain.com,etc..." required />
								</td>
								<td colSpan="2"></td>
							</tr>

						</tbody>
					</table>
				</form>
			</div>

			{/* back to account */}
			<BackButton to="/account" />

		</>
	);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
};
