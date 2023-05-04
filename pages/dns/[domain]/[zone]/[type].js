import { useRouter } from "next/router";
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../../../../components/BackButton.js';
import ErrorAlert from '../../../../components/ErrorAlert.js';
import * as API from '../../../../api.js';

const DnsEditRecordPage = (props) => {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const { domain, zone: routerZone, type: routerType } = router.query;
	const newRecord = router.asPath === `/dns/${domain}/new`;
	const [zone, setZone] = useState(routerZone || "name");
	const [type, setType] = useState(routerType || "a");
	const [recordSet, setRecordSet] = useState(state.recordSet)
	const [error, setError] = useState();

	useEffect(() => {
		if (!recordSet) {
			API.getDnsRecords(domain, zone, type, dispatch, setError, router)
				.then(res => {
					if (res && res.recordSet) {
						setRecordSet([...res.recordSet]);
					}
				});
				
		}
	}, [recordSet, domain, zone, type, router]);

	if (!recordSet && !newRecord) {
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
	const supportsGeo = ["a", "aaaa"].includes(type);
	const supportsHealth = ["a", "aaaa"].includes(type);

	return (
		<>

			<Head>
				<title>
					{`${domain} / Records list / ${newRecord?'New':'Edit'} record set`}
				</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className="fw-bold">
				{domain} / Records list / {newRecord?'New':'Edit'} record set:
			</h5>

			{/* Record editing form */}
			<form onSubmit={e => {
				e.preventDefault();
				console.log(e)
			}}>
				<input type="hidden" name="_csrf" value={csrf} />
				<div className="card text-bg-dark col p-3 border-0 shadow-sm">
					<div className="row mb-3">
						<div className="col">
							<label className="w-100">
								Type (required)
								<select 
									className="form-select"
									name="type"
									defaultValue={type}
									onChange={e => setType(e.target.value)}
									required
									disabled={!newRecord}>
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
								<input
									className="form-control"
									type="text"
									name="name"
									defaultValue={zone}
									required 
									disabled={!newRecord}
									onChange={e => setZone(e.target.value)}
								/>
							</label>
						</div>
						<div className="col">
							<label className="w-100">
								TTL
								<input
									className="form-control"
									type="number"
									name="ttl"
									min="30"
									required
									defaultValue={recordSet[0].ttl || 300}
								/>
							</label>
						</div>
					</div>

					
					<div className="row mb-3">
						<div className="col-4">
							Record selection mode:
							<div className="form-check">
								<input className="form-check-input" type="radio" name="selection" id="roundrobin" defaultChecked />
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
								<input className="form-check-input" type="radio" name="selection" id="geo" />
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
								{supportsHealth && <div className="col-2">
									ID: 
									<input className="form-control" type="text" name={`id${i}`} defaultValue={rec.id} required />
								</div>}
								<div className="col">
									<label className="w-100">
										Value
										<input className="form-control" type="text" name={`value_${i}`} defaultValue={rec.ip || rec.host || rec.value || rec.ns || rec.text} required />
									</label>
								</div>
								{supportsHealth && <div className="col-auto align-self-end mb-2">
									<div className="form-check form-switch">
									  <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" defaultChecked={rec.h} />
									  <label className="form-check-label" htmlFor="flexCheckDefault">
									    Health Check
									  </label>
									</div>
								</div>}
								<div className="col-auto ms-auto">
									<button
										className="btn btn-danger mt-4"
											onClick={(e) =>{
											e.preventDefault();
											recordSet.splice(i, 1);
											setRecordSet([...recordSet]);
										}}
										disabled={i === 0}
									>
										×
									</button>
								</div>
							</div>
							{supportsGeo && <div className="row">
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
								<div className="col-3">
									<label className="w-100">
										Fallback Selector
										<select className="form-select" name={`sel_${i}`} defaultValue={rec.sel} required>
											<option value="0">None</option>
											<option value="1">First</option>
											<option value="2">Random</option>
											<option value="3">All</option>
										</select>
									</label>
								</div>
								<div className="col-3">
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
							</div>}
							{i < recordSet.length-1 && <hr className="mb-2 mt-3" />}
						</>))}
						<div className="row mt-2">
							<div className="col-auto ms-auto">
								<button className="ms-auto btn btn-success mt-2" onClick={(e) =>{
									e.preventDefault();
									recordSet.push({})
									setRecordSet([...recordSet]);
								}}>
									+
								</button>
							</div>
						</div>
					</div>
				</div>
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
