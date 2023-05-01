import { useRouter } from "next/router";
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
		recordSets: [
			{ 
				"@": {
					"a": [
						{ "id": "a", "ttl": 300, "ip": "203.28.238.247", "geok": "cn", "geov": ["OC"], "h": true, "fb": ["b", "c"], "sel": 1, "bsel": 3 },
						{ "id": "b", "ttl": 300, "ip": "38.60.199.224", "geok": "cn", "geov": ["AS"], "h": false, "fb": ["a", "c"], "sel": 1, "bsel": 3 },
						{ "id": "c", "ttl": 300, "ip": "45.88.201.168", "geok": "cn", "geov": ["NA"], "h": true, "fb": ["e", "d"], "sel": 1, "bsel": 3 },
						{ "id": "d", "ttl": 300, "ip": "185.125.168.21", "geok": "cn", "geov": ["EU", "AF"], "h": true, "fb": ["c"], "sel": 1, "bsel": 3 },
						{ "id": "e", "ttl": 300, "ip": "38.54.57.171", "geok": "cn", "geov": ["SA", "AF"], "h": true, "fb": [], "sel": 1, "bsel": 3 }
					],
					"aaaa": [
						{ "id": "a", "ttl": 300, "ip": "2a03:94e0:ffff:185:125:168:0:21", "geok": "cn", "geov": ["EU", "AF"], "h": true, "fb": ["b"], "sel": 1, "bsel": 3 },
						{ "id": "b", "ttl": 300, "ip": "2a03:94e1:ffff:45:88:201:0:168", "geok": "cn", "geov": ["NA", "SA", "AS", "OC"], "h": true, "fb": ["a"], "sel": 1, "bsel": 3 }
					],
					"caa": [
						{ "flag": 0, "tag": "issue", "value": "letsencrypt.org" },
						{ "flag": 0, "tag": "iodef", "value": "mailto:tom@69420.me" }
					],
					"soa": { "ttl": 86400, "minttl": 30, "mbox": "root.basedflare.com.", "ns": "esther.kikeflare.com.", "refresh": 86400, "retry": 7200, "expire": 3600 },
					"txt": [
						{ "ttl": 300, "text": "v=spf1 -all" }
					],
					"ns": [
						{ "ttl": 86400, "host": "esther.kikeflare.com." },
						{ "ttl": 86400, "host": "aronowitz.bfcdn.host." },
						{ "ttl": 86400, "host": "goldberg.fatpeople.lol." }
					]
				}
			}
		]
	});
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.recordSets) {
			// API.getDomainRecordSets(domain, dispatch, setError, router);
		}
	}, [state.recordSets, domain, router]);

	if (state.recordSets == null) {
		return (
			<div className="d-flex flex-column">
				{error && <ErrorAlert error={error} />}
				<div className="text-center mb-4">
					Loading...
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
					{domain} / Records list
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
