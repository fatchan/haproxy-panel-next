import { useRouter } from "next/router";
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../../../../components/BackButton.js';
import ErrorAlert from '../../../../components/ErrorAlert.js';
import Select from 'react-select';
import countries from 'i18n-iso-countries';
countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
import * as API from '../../../../api.js';

const continentMap = {
	'NA': 'North America',
	'SA': 'South America',
	'EU': 'Europe',
	'AS': 'Asia',
	'OC': 'Oceania',
	'AF': 'Africa',
	'AN': 'Antarctica',
}

const countryOptions = Object.entries(countries.getNames('en'))
	.map(e => ({ value: e[0], label: `${e[1]} (${e[0]})` }));

const fromEntries = (pairs) => {
	return pairs
		.reduce((obj, [k, v]) => {
			return {
				...obj,
				[k]: k in obj
				? [].concat(obj[k], v)
				: (k.startsWith('geov_') || k.startsWith('fallbacks_') ? [v] : v)
			}
		}, {})
};

const DnsEditRecordPage = (props) => {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const { domain, zone: routerZone, type: routerType } = router.query;
	const newRecord = router.asPath === `/dns/${domain}/new`;
	const [recordSet, setRecordSet] = useState();
	const [zone, setZone] = useState(routerZone || "name");
	const [type, setType] = useState(routerType || "a");
	const [recordSelection, setRecordSelection] = useState("roundrobin");
	const [error, setError] = useState();
	const handleIdChange = (value, index) => {
		recordSet[index].id = value;
		setRecordSet([...recordSet]);
	}
	const handleValueChange = (value, index) => {
		recordSet[index].ip = value;
		setRecordSet([...recordSet]);
	}
	const handleGeoKeyChange = (value, index) => {
		recordSet[index].geok = value;
		recordSet[index].geov = [];
		setRecordSet([...recordSet]);
	}
	const getFallbackValue = (id) => {
		const rec = recordSet.find(r => r.id === id);
		if (rec) {
			return (rec.ip || rec.host || rec.value || rec.ns || rec.text || rec.target || 'No Value');
		}
		return 'No Value'
	}

	useEffect(() => {
		if (!recordSet) {
			API.getDnsRecords(domain, zone, type, dispatch, setError, router)
				.then(res => {
					if (res && res.recordSet) {
						setRecordSet(res.recordSet.length > 0 ? [...res.recordSet] : [{}]);
						setRecordSelection(res.recordSet.length > 0 && res.recordSet[0].geok ? "geo" : "roundrobin");
					}
				});
		}
	}, [recordSet, domain, zone, type, router]);

	if (!recordSet) {
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

	async function addUpdateRecord(e) {
		e.preventDefault();
		console.log(fromEntries([...new FormData(e.target).entries()]));
		await API.addUpdateDnsRecord(domain, zone, type, fromEntries([...new FormData(e.target).entries()]), dispatch, setError, router);
	}

	const { csrf } = state;
	const supportsGeo = ["a", "aaaa"].includes(type) && recordSelection === "geo";
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
			<form
				method="POST"
				action={`/forms/dns/${domain}/${zone}/${type}`}
				onSubmit={addUpdateRecord}
			>
				<input type="hidden" name="_csrf" value={csrf} />
				<div className="card text-bg-dark col p-3 border-0 shadow-sm">
					<div className="row mb-3">
						<div className="col">
							<label className="w-100">
								Type
								<select
									className="form-select"
									name="type"
									defaultValue={type}
									value={type}
									onChange={e => setType(e.target.value)}
									required
									disabled={!newRecord}>
									<option value="">Type</option>
									<optgroup label="Standard">
										<option value="a">A</option>
										<option value="aaaa">AAAA</option>
										<option value="txt">TXT</option>
										<option value="cname">CNAME</option>
										<option value="ns">NS</option>
										<option value="mx">MX</option>
										<option value="srv">SRV</option>
										<option value="caa">CAA</option>
										<option value="soa">SOA</option>
									</optgroup>
									<optgroup label="Templates">
										<option value="a_template">A (template)</option>
										<option value="aaaa_template">AAAA (template)</option>
									</optgroup>
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
						{!type.endsWith('_template') && <div className="col">
							<label className="w-100">
								TTL
								<input
									className="form-control"
									type="number"
									name="ttl"
									min="30"
									required
									defaultValue={recordSet && recordSet.length > 0 ? recordSet[0].ttl : 300}
								/>
							</label>
						</div>}
					</div>

					{(type === "a" || type === "aaaa") && <div className="row mb-3">
						<div className="col-4">
							Record selection mode:
							<div className="form-check">
								<input
									className="form-check-input"
									type="radio"
									name="selection"
									id="roundrobin"
									value="roundrobin"
									checked={recordSelection === "roundrobin"}
									onChange={e => setRecordSelection(e.target.value)}
								/>
								<label
									className="form-check-label"
									htmlFor="roundrobin">
									Round Robin
								</label>
							</div>
							{/*<div className="form-check">
								<input
									className="form-check-input"
									type="radio"
									name="selection"
									id="weight"
									value="weight"
									onChange={e => setRecordSelection(e.target.value)}
								/>
								<label
									className="form-check-label"
									htmlFor="weight">
									Weighted
								</label>
							</div>*/}
							<div className="form-check">
								<input
									className="form-check-input"
									type="radio"
									name="selection"
									value="geo"
									id="geo"
									onChange={e => setRecordSelection(e.target.value)}
									checked={recordSelection === "geo"}
								/>
								<label
									className="form-check-label"
									htmlFor="geo">
									Geolocation
								</label>
							</div>
						</div>
					</div>}
					{!type.endsWith('_template') && <div className="col">
						<div className="row">
							<div className="col">
								Records:
							</div>
						</div>
						{recordSet.map((rec, i) => {
							let typeFields;
							switch (type) {
								case "mx":
									typeFields = <div className="row">
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Preference
												<input className="form-control" type="number" name={`preference_${i}`} defaultValue={rec.preference} required />
											</label>
										</div>
									</div>;
									break;
								case "srv":
									typeFields = <div className="row">
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Preference
												<input className="form-control" type="number" name={`preference_${i}`} defaultValue={rec.preference} required />
											</label>
										</div>
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Port
												<input className="form-control" type="number" name={`port_${i}`} defaultValue={rec.port} required />
											</label>
										</div>
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Weight
												<input className="form-control" type="number" name={`weight_${i}`} defaultValue={rec.weight} required />
											</label>
										</div>
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Priority
												<input className="form-control" type="number" name={`priority_${i}`} defaultValue={rec.priority} required />
											</label>
										</div>
									</div>;
									break;
								case "caa":
									typeFields = <div className="row">
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Flag
												<input className="form-control" type="number" name={`flag_${i}`} defaultValue={rec.flag} required />
											</label>
										</div>
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Tag
												<input className="form-control" type="text" name={`tag_${i}`} defaultValue={rec.tag} required />
											</label>
										</div>
									</div>;
									break;
								case "soa":
									typeFields = <div className="row">
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												MBox
												<input className="form-control" type="text" name={`mbox_${i}`} defaultValue={rec.MBox} required />
											</label>
										</div>
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Refresh
												<input className="form-control" type="number" name={`refresh_${i}`} defaultValue={rec.refresh} required />
											</label>
										</div>
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Retry
												<input className="form-control" type="number" name={`retry_${i}`} defaultValue={rec.retry} required />
											</label>
										</div>
										<div className="col-sm-12 col-md-3">
											<label className="w-100">
												Expire
												<input className="form-control" type="number" name={`expire_${i}`} defaultValue={rec.expire} required />
											</label>
										</div>
										{/*<div className="col-sm-12 col-md-3">
											<label className="w-100">
												MinTTL
												<input className="form-control" type="number" name={`minttl_${i}`} defaultValue={rec.refresh} required />
											</label>
										</div>*/}
									</div>;
									break;
								default:
									break;
							}
							return (<>
								<div className="row" key={`row1_${i}`}>
									{supportsHealth && <div className="col-sm-4 col-md-2">
										ID:
										<input
											className="form-control"
											type="text"
											name={`id_${i}`}
											onChange={(e) => handleIdChange(e.target.value, i)}
											defaultValue={rec.id} required
										/>
									</div>}
									<div className="col">
										<label className="w-100">
											Value
											<input
												className="form-control"
												type="text"
												name={`value_${i}`}
												onChange={(e) => handleValueChange(e.target.value, i)}
												defaultValue={rec.ip || rec.host || rec.value || rec.ns || rec.text || rec.target}
												required
											/>
										</label>
									</div>
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
								{typeFields}
								{supportsHealth && <div className="row" key={`row2_${i}`}>
									<div className="col-sm-12 col-md-2 align-self-end mb-2">
										<div className="form-check form-switch">
											<input
												className="form-check-input"
												type="checkbox"
												name={`health_${i}`}
												value="1"
												id="flexCheckDefault"
												checked={rec.h === true}
												onChange={(e) =>{
													recordSet[i].h = e.target.checked;
													setRecordSet([...recordSet]);
												}}
											/>
											<label className="form-check-label" htmlFor="flexCheckDefault">
												Health Check
											</label>
										</div>
									</div>
									<div className="col-sm-12  col-md">
										<label className="w-100">
											Fallback IDs
											<Select
												theme={(theme) => ({
													...theme,
													borderRadius: 5,
												})}
												isDisabled={!rec.h}
												//required
												isMulti
												closeMenuOnSelect={false}
												options={recordSet.filter(x => x.id !== rec.id).map(x => ({ label: x.id, value: x.id}) )}
												getOptionLabel={x => `${x.value} (${getFallbackValue(x.value)})`}
												defaultValue={(rec.fb||[]).map(x => ({ value: x, label: x }))}
												classNamePrefix="select"
												name={`fallbacks_${i}`}
												className="basic-multi-select"
											/>
										</label>
									</div>
									<div className="col-sm-12 col-md-3">
										<label className="w-100">
											Backup Selector
											<select
												className="form-select"
												name={`sel_${i}`}
												defaultValue={rec.sel}
												disabled={!rec.h}
												required
											>
												<option value="0">None</option>
												<option value="1">First</option>
												<option value="2">Random</option>
												<option value="3">All</option>
											</select>
										</label>
									</div>
									<div className="col-sm-12 col-md-3">
										<label className="w-100">
											Backup Selector
											<select
												className="form-select"
												name={`bsel_${i}`}
												defaultValue={rec.bsel}
												disabled={!rec.h}
												required
											>
												<option value="0">None</option>
												<option value="1">First</option>
												<option value="2">Random</option>
												<option value="3">All</option>
											</select>
										</label>
									</div>
								</div>}
								{supportsGeo && <div className="row" key={`row3_${i}`}>
									<div className="col-sm-12 col-md-2">
										<label className="w-100">
											Geo Key
											<select
												className="form-select"
												onChange={(e) => handleGeoKeyChange(e.target.value, i)}
												name={`geok_${i}`}
												defaultValue={rec.geok}
												required>
												<option value="cn">Continent</option>
												<option value="cc">Country</option>
											</select>
										</label>
									</div>
									<div className="col">
										<label className="w-100">
											Geo Value(s)
											{rec.geok === "cc"
												? <Select
													theme={(theme) => ({
														...theme,
														borderRadius: 5,
													})}
													required
													isMulti
													closeMenuOnSelect={false}
													options={countryOptions}
													// value={(rec.geov||[]).map(x => ({ value: x, label: `${countries.getName(x, 'en')} (${x})` }))}
													getOptionLabel={x => `${countries.getName(x.value, 'en')} (${x.value})`}
													defaultValue={(rec.geov||[]).map(x => ({ value: x, label: x }))}
													classNamePrefix="select"
													key={`geov_${rec.geok}_${i}`}
													name={`geov_${i}`}
													className="basic-multi-select"
												/>
												: <Select
													theme={(theme) => ({
														...theme,
														borderRadius: 5,
													})}
													required
													isMulti
													closeMenuOnSelect={false}
													options={[
														{ value: 'NA', label: 'North America' },
														{ value: 'SA', label: 'South America' },
														{ value: 'EU', label: 'Europe' },
														{ value: 'AS', label: 'Asia' },
														{ value: 'OC', label: 'Oceania' },
														{ value: 'AF', label: 'Africa' },
														{ value: 'AN', label: 'Antarctica' },
													]}
													// value={(rec.geov||[]).map(x => ({ value: x, label: continentMap[x] }))}
													getOptionLabel={x => `${continentMap[x.value]} (${x.value})`}
													defaultValue={(rec.geov||[]).map(x => ({ value: x, label: x }))}
													classNamePrefix="select"
													key={`geov_${rec.geok}_${i}`}
													name={`geov_${i}`}
													className="basic-multi-select"
												/>}
										</label>
									</div>
								</div>}
								{i < recordSet.length-1 && <hr className="mb-2 mt-3" />}
							</>);
						})}
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
					</div>}
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
