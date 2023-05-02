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

	let recordSet = recordSets.find(x => x[zone] != null)[zone][type];
	recordSet = Array.isArray(recordSet) ? recordSet : [recordSet]

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
			<form className="card text-bg-dark col p-3 border-0 shadow-sm" onSubmit={e => {
				e.preventDefault();
				console.log(e)
			}}>

				<div className="row mb-3">
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
							<input className="form-control" type="text" name="key" value={zone} readOnly required />
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

				
				<div className="row mb-3">
					<div className="col-4">
						Record selection mode:
						<div className="form-check">
							<input className="form-check-input" type="radio" name="selection" id="roundrobin" checked={!recordSet[0].geok} />
							<label className="form-check-label" htmlFor="roundrobin">
								Round Robin
							</label>
						</div>
						<div className="form-check">
							<input className="form-check-input" type="radio" name="selection" id="weight" />
							<label className="form-check-label" htmlFor="weight">
								Weighted
							</label>
						</div>
						<div className="form-check">
							<input className="form-check-input" type="radio" name="selection" id="geo" checked={recordSet[0].geok != null} />
							<label className="form-check-label" htmlFor="geo">
								Geolocation
							</label>
						</div>
					</div>
					{/*<div className="col-4">
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
					</div>*/}
				</div>


				<div className="col">
					<div className="row">
						<div className="col">
							Records:
						</div>
					</div>
					{recordSet.map((rec, i) => (<>
						<div className="row">
							<div className="col-2">
								ID: 
								<input className="form-control" type="text" name={`id${i}`} defaultValue={rec.id} required />
							</div>
							<div className="col">
								<label className="w-100">
									Value
									<input className="form-control" type="text" name={`value_${i}`} defaultValue={rec.ip || rec.host || rec.value || rec.ns || rec.text} required />
								</label>
							</div>
							<div className="col-auto align-self-end mb-2">
								<div className="form-check form-switch">
								  <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" checked={rec.h} />
								  <label className="form-check-label" htmlFor="flexCheckDefault">
								    Health Check
								  </label>
								</div>
							</div>
							<div className="col-auto ms-auto">
								<button className="btn btn-danger mt-4">
									×
								</button>
							</div>
						</div>
						<div className="row">
							<div className="col-2">
								<label className="w-100">
									Geo Key
									<select className="form-select" name={`geok_${i}`} defaultValue={rec.geok} required>
										<option value="cn">Continent</option>
										<option value="cc">Country</option>
									</select>
								</label>
							</div>
							<div className="col">
								<label className="w-100">
									Geo Value(s)
									<input className="form-control" type="text" name={`geov_${i}`} defaultValue={(rec.geov||[]).join(', ')} required />
								</label>
							</div>
							<div className="col-2">
								<label className="w-100">
									Selector
									<select className="form-select" name={`sel_${i}`} defaultValue={rec.sel} required>
										<option value="0">None</option>
										<option value="1">First</option>
										<option value="2">Random</option>
										<option value="3">All</option>
									</select>
								</label>
							</div>
							<div className="col-2">
								<label className="w-100">
									Backup Selector
									<select className="form-select" name={`bsel_${i}`} defaultValue={rec.bsel} required>
										<option value="0">None</option>
										<option value="1">First</option>
										<option value="2">Random</option>
										<option value="3">All</option>
									</select>
								</label>
							</div>
						</div>
						{i < recordSet.length && <hr className="mb-2 mt-3" />}
					</>))}
					<div className="row mt-4">
						<div className="col-auto me-auto">
							<BackButton to={`/dns/${domain}`} />
						</div>
						{/*<div className="col-auto ms-auto">
							<button className="btn btn-secondary">
								Cancel
							</button>
						</div>*/}
						<div className="col-auto">
							<button className="btn btn-success">
								Save
							</button>
						</div>
					</div>
				</div>

			
			</form>

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
