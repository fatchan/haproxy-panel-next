import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js'
import { useRouter } from 'next/router';

export default function Csr(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getAccount(dispatch, setError, router);
		}
	}, [state.user, state.maps, router]);

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

	const { csrf } = state;

	return (
		<>

			<Head>
				<title>Certificate Signing Request</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className="fw-bold">
				Certificate Signing Request:
			</h5>

			<p>
				To generate a certificate signing request for your domain and/or subdomain(s):
				<div>
					<code>
						{`openssl req -newkey rsa:4096 -new -nodes -subj "/CN=`}<strong>yourdomain.com</strong>{`/OU=OrganisationUnit/O=Organisation/L=Locality/ST=St/C=Co" -sha256 -extensions v3_req -reqexts SAN -keyout origin.key -out origin.csr -config <(cat /etc/ssl/openssl.cnf \<\(printf "[SAN]\\nsubjectAltName=DNS:`}<strong>www.yourdomain.com</strong>{`"))`}
					</code>
				</div>
			</p>

			<div className="table-responsive">
				<table className="table text-nowrap">
					<tbody>
						<tr className="align-middle">
							<td className="col-1 text-center">
								<form className="d-flex" action="/forms/csr/verify" method="post">
									<input type="hidden" name="_csrf" value={csrf} />
									<textarea className="form-control mx-3" name="csr" placeholder="-----BEGIN CERTIFICATE REQUEST----- ..." required />
									<input className="btn btn-success" type="submit" value="Verify" />
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

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
}
