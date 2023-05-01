import { useRouter } from "next/router";
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import RecordSetRow from '../../../../components/RecordSetRow.js';
import BackButton from '../../../../components/BackButton.js';
import ErrorAlert from '../../../../components/ErrorAlert.js';
import * as API from '../../../../api.js';

const DnsEditRecordPage = (props) => {

	const router = useRouter();
	const { domain, zone, type } = router.query;
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

	const { user, recordSets, csrf, editing } = state;

	const recordSet = recordSets.find(x => x[zone] != null)[zone][type];

	return (
		<>

			<Head>
				<title>
					{domain} / Records list / Edit record set
				</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className="fw-bold">
				{domain} / Records list / Edit record set:
			</h5>

			{/* Record editing form */}
			<div className="col">

				<div className="row">
					<div className="col">
						<label className="w-100">
							Type (required)
							<select className="form-select" name="value" defaultValue={type} required>
								<option value="">Type</option>
								<option value="a">A</option>
								<option value="aaaa">AAAA</option>
								<option value="txt">TXT</option>
								<option value="cname">CNAME</option>
								<option value="ns">NS</option>
								<option value="mx">MX</option>
								<option value="srv">SRV</option>
								<option value="caa">CAA</option>
								<option value="soa">SOA</option>
							</select>
						</label>
					</div>
					<div className="col">
						<label className="w-100">
							Name
							<input className="form-control" type="text" name="key" value={zone} readonly required />
						</label>
					</div>
					<div className="col">
						<label className="w-100">
							TTL
							<input
								className="form-control" type="number" name="key" min="30" required
								value={Array.isArray(recordSet) ? recordSet[0].ttl : recordSet.ttl}
							/>
						</label>
					</div>
				</div>

				
				<div className="row">
					<div className="col-4">
						Record selection mode:
						<div className="form-check">
							<input className="form-check-input" type="radio" name="selection" id="weight" checked />
							<label className="form-check-label" htmlFor="weight">
								Weight
							</label>
						</div>
						<div className="form-check">
							<input className="form-check-input" type="radio" name="selection" id="weight" />
							<label className="form-check-label" htmlFor="weight">
								Geolocation
							</label>
						</div>
					</div>
					<div className="col-4">
						Record selection mode:
						<div className="form-check">
							<input className="form-check-input" type="radio" name="selection" id="weight" checked />
							<label className="form-check-label" htmlFor="weight">
								Weight
							</label>
						</div>
						<div className="form-check">
							<input className="form-check-input" type="radio" name="selection" id="weight" />
							<label className="form-check-label" htmlFor="weight">
								Geolocation
							</label>
						</div>
					</div>
				</div>

			
			</div>

			{/* back to account */}
			<BackButton to={`/dns/${domain}`} />

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

export default DnsEditRecordPage;
