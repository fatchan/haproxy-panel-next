import { useRouter } from "next/router";
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import RecordSetRow from '../../../components/RecordSetRow.js';
import BackButton from '../../../components/BackButton.js';
import ErrorAlert from '../../../components/ErrorAlert.js';
import * as API from '../../../api.js';

const DnsDomainIndexPage = (props) => {

	const router = useRouter();
	const { domain } = router.query;
	const [state, dispatch] = useState({
		...props,
	});
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.recordSets) {
			API.getDnsDomain(domain, dispatch, setError, router);
		}
	}, [state.recordSets, domain, router]);

	if (state.recordSets == null) {
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

	const { user, recordSets, csrf } = state;

	const recordSetRows = recordSets
		.map(recordSet => {
			return Object.entries(recordSet)
				.map(e => {
					return Object.entries(e[1])
						.map((recordSet, i) => (
							<RecordSetRow
								domain={domain}
								key={`${e[0]}_${i}`}
								name={e[0]}
								recordSet={recordSet}
							/>
						));
				});
		})
			

	return (
		<>

			<Head>
				<title>
					{`${domain} / Records list`}
				</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className="fw-bold">
				{domain} / Records list:
			</h5>

			{/* Record sets table */}
			<div className="table-responsive">
				<table className="table text-nowrap m-1">
					<tbody>

						{/* header row */}
						<tr>
							<th>
								Name
							</th>
							<th>
								Type
							</th>
							<th>
								Content
							</th>
							<th>
								TTL
							</th>
							<th>
								Details
							</th>
							<th>
								Actions
							</th>
						</tr>

						{recordSetRows}

					</tbody>
				</table>
			</div>

			
			<div className="my-3">
				<Link href={`/dns/${domain}/new`}>
					<a className="btn btn-success">
						+
					</a>
				</Link>
			</div>

			{/* back to account */}
			<BackButton to="/domains" />

		</>
	);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return {
		props: {
			user: res.locals.user || null,
			...query
		}
	};
}

export default DnsDomainIndexPage;
