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
			<>
				Loading...
				{error && <ErrorAlert error={error} />}
			</>
		);
	}

	const { user, csrf, certs } = state;

	async function addCert(e) {
		e.preventDefault();
		await API.addCert({
			_csrf: csrf,
			subject: e.target.subject.value,
			altnames: e.target.altnames.value.split(',').map(x => x.trim())
		}, dispatch, setError, router);
		await API.getCerts(dispatch, setError, router);
	}

	async function deleteCert(e) {
		e.preventDefault();
		await API.deleteCert({ _csrf: csrf, subject: e.target.subject.value }, dispatch, setError, router);
		await API.getCerts(dispatch, setError, router);
	}

	const certList = certs.map((d, i) => {
		//TODO: refactor, to component
		return (
			<tr key={i} className="align-middle">
				<td className="col-1 text-center">
					<form onSubmit={deleteCert} action="/forms/cert/delete" method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="subject" value={d.subject || d._id} />
						<input className="btn btn-danger" type="submit" value="×" />
					</form>
				</td>
				<td>
					{d.subject || '-'}
				</td>
				<td>
					{d.altnames && d.altnames.join(', ') || '-'}
				</td>
				<td>
					{d.date || '-'}
				</td>
				<td>
					{d.storageName || '-'}
				</td>
			</tr>
		);
	})

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
				<table className="table table-bordered text-nowrap">
					<tbody>

						<tr className="align-middle">
							<th className="col-1" />
							<th>
								Subject
							</th>
							<th>
								Altname(s)
							</th>
							<th>
								Creation Date
							</th>
							<th>
								Storage Name
							</th>
						</tr>

						{certList}

						{/* Add new cert form */}
						<tr className="align-middle">
							<td className="col-1 text-center" colSpan="3">
								<form className="d-flex" onSubmit={addCert} action="/forms/cert/add" method="post">
									<input type="hidden" name="_csrf" value={csrf} />
									<input className="btn btn-success" type="submit" value="+" />
									<input className="form-control mx-3" type="text" name="subject" placeholder="domain.com" required />
									<input className="form-control me-3" type="text" name="altnames" placeholder="www.domain.com,staging.domain.com,etc..." required />
								</form>
							</td>
						</tr>

					</tbody>
				</table>
			</div>

			{/* back to account */}
			<BackButton to="/account" />

		</>
	);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
}
