import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Select from 'react-select';
import MapRow from '../../components/MapRow.js';
import BackButton from '../../components/BackButton.js';
import ErrorAlert from '../../components/ErrorAlert.js';
import SearchFilter from '../../components/SearchFilter.js';
import * as API from '../../api.js';

import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
countries.registerLocale(enCountries);
const continentMap = {
	'NA': 'North America',
	'SA': 'South America',
	'EU': 'Europe',
	'AS': 'Asia',
	'OC': 'Oceania',
	'AF': 'Africa',
	'AN': 'Antarctica',
};

const countryOptions = Object.entries(countries.getNames('en'))
	.map(e => ({ value: e[0], label: `${e[1]} (${e[0]})` }));

const MapPage = (props) => {

	const router = useRouter();
	const { name: mapName } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState('');
	const changedMap = state.mapInfo?.name != mapName;

	useEffect(() => {
		if (!state.map || changedMap) {
			API.getMap(mapName, dispatch, setError, router);
		}
	}, [state.map, mapName, router, changedMap]);

	if (state.map == null || changedMap) {
		return (
			<div className='d-flex flex-column'>
				{error && <ErrorAlert error={error} />}
				<div className='text-center mb-4'>
					<div className='spinner-border mt-5' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	const { user, mapValueNames, mapInfo, map, csrf, showValues, mapNotes } = state;

	if (user && !user.onboarding) {
		router.push('/onboarding');
	}

	async function addToMap(e) {
		e.preventDefault();
		await API.addToMap(mapInfo.name, {
			_csrf: csrf,
			//general maps
			key: e.target.key.value,
			value: e.target.value?.value,
			note: e.target.note?.value,
			//ddos_config
			pd: e.target.pd?.value,
			pt: e.target.pt?.value,
			cex: e.target.cex?.value,
			cip: e.target.cip?.checked,
			//ddos
			m: e.target.m?.value,
			t: e.target.t?.checked || null,
		 }, dispatch, setError, router);
		await API.getMap(mapName, dispatch, setError, router);
		e.target.reset();
	}

	async function deleteFromMap(csrf, key) {
		await API.deleteFromMap(mapInfo.name, { _csrf: csrf, key }, dispatch, setError, router);
		await API.getMap(mapName, dispatch, setError, router);
	}

	const mapRows = map
		.filter(row => {
			const rowValue = typeof row.value === 'object'
				? Object.values(row.value)
				: row.value;
			return row.key.includes(filter)
				|| rowValue.includes(filter);
		})
		.map((row, i) => {
			return (
				<MapRow
					key={i}
					row={row}
					name={mapInfo.name}
					csrf={csrf}
					showValues={showValues}
					mapValueNames={mapValueNames}
					onDeleteSubmit={deleteFromMap}
					mapNote={mapNotes[row.key]}
					columnKeys={mapInfo.columnKeys}
				/>
			);
		});

	let formElements
		, mapInfoHelper;
	//TODO: env var case map names
	switch (mapInfo.name) {
		case 'ddos': {
			const mapValueOptions = Object.entries(mapValueNames)
				.map((entry, i) => (<option key={'option'+i} value={entry[0]}>{entry[1]}</option>));
			mapInfoHelper = <div className='alert alert-info' role='info'>
				Select which domains or domain+paths have an interstitial bot-check page enabled. Recommended for the best protection and/or if you are frequently targeted by attacks.
			</div>;
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<input className='form-control' type='text' name='key' placeholder='domain/path' required />
					</td>
					<td>
						<select className='form-select' name='m' defaultValue='' required>
							<option disabled value=''>protection mode</option>
							{mapValueOptions}
						</select>
					</td>
					<td>
						<div className='form-check'>
							<input className='form-check-input' type='checkbox' name='t' value='t' id='t' />
							<label className='form-check-label' htmlFor='t'>Tor exits only</label>
						</div>
					</td>
				</>
			);
			break;
		}
		case 'ddos_config': {
			const domainSelectOptions = user.domains.map((d, i) => (<option key={'option'+i} value={d}>{d}</option>));
			mapInfoHelper = <div className='alert alert-info' role='info'>
				Set the parameters of the bot check for a domain or domain+path.
			</div>;
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<select className='form-select' name='key' defaultValue='' required>
							<option value='' />
							{domainSelectOptions}
						</select>
					</td>
					<td>
						<input className='form-control' type='number' min='8' defaultValue='24' name='pd' placeholder='difficulty' required />
					</td>
					<td>
						<select className='form-select' name='pt' required>
							<option disabled value=''>pow type</option>
							<option value='sha256'>sha256</option>
							<option value='argon2'>argon2</option>
						</select>
					</td>
					<td>
						<input className='form-control' type='number' name='cex' placeholder='cookie expiry (seconds)' required />
					</td>
					<td>
						<div className='form-check'>
							<input className='form-check-input' type='checkbox' name='cip' value='cip' id='cip' />
							<label className='form-check-label' htmlFor='cip'>Lock cookie to IP</label>
						</div>
					</td>
				</>
			);
			break;
		}
		case 'hosts': {
			const domainSelectOptions = user.domains.map((d, i) => (<option key={'option'+i} value={d}>{d}</option>));
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<select className='form-select' name='key' defaultValue='' required>
							<option value='' />
							{domainSelectOptions}
						</select>
					</td>
					{
						(process.env.NEXT_PUBLIC_CUSTOM_BACKENDS_ENABLED && mapInfo.name === 'hosts') &&
						<td>
							<input
								className='form-control'
								type='text'
								name='value'
								placeholder='backend ip:port'
								required
							/>
						</td>
					}
				</>
			);
			break;
		}
		case 'maintenance': {
			const activeDomains = map.map(e => e.key);
			const inactiveDomains = user.domains.filter(d => !activeDomains.includes(d));
			const domainSelectOptions = inactiveDomains.map((d, i) => (<option key={'option'+i} value={d}>{d}</option>));
			mapInfoHelper = <div className='alert alert-info' role='info'>
				Serve a page from the edge letting your visitors know your site is undergoing maintenance or downtime.
			</div>;
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<select className='form-select' name='key' defaultValue='' required>
							<option value='' />
							{domainSelectOptions}
						</select>
					</td>
				</>
			);
			break;
		}
		case 'blockedip':
		case 'whitelist':
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<input className='form-control' type='text' name='key' placeholder='ip or subnet' required />
					</td>
				</>
			);
			break;
		case 'blockedasn':
			mapInfoHelper = <div className='alert alert-info' role='info'>
				ASN Blocking blocks entire networks containing multiple netblocks. Visit <a target='_blank' rel='noreferrer' href='https://bgp.tools'>bgp.tools</a> to search ASNs, or find the ASN of a particular IP or netblock.
			</div>;
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<input className='form-control' type='text' name='key' placeholder='ASN' required />
					</td>
					<td>
						<input className='form-control' type='text' name='note' placeholder='Note' />
					</td>
				</>
			);
			break;
		case 'blockedcc':
			mapInfoHelper = <div className='alert alert-info' role='info'>
				Blocked countries based on geoip data. Uses <a target='_blank' rel='noreferrer' href='https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes'>ISO 3166-1 alpha-2 country codes</a>.
			</div>;
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<Select
							theme={(theme) => ({
								...theme,
								borderRadius: 5,
							})}
							required
							closeMenuOnSelect={true}
							options={countryOptions}
							// value={(rec.geov||[]).map(x => ({ value: x, label: `${countries.getName(x, 'en')} (${x})` }))}
							getOptionLabel={x => `${countries.getName(x.value, 'en')} (${x.value})`}
							classNamePrefix='select'
							name='key'
							className='basic-multi-select'
						/>
					</td>
				</>
			);
			break;
		case 'blockedcn':
			mapInfoHelper = <div className='alert alert-info' role='info'>
				Block continents based on geoip data.
			</div>;
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<Select
							theme={(theme) => ({
								...theme,
								borderRadius: 5,
							})}
							required
							closeMenuOnSelect={true}
							options={[
								{ value: 'NA', label: 'North America' },
								{ value: 'SA', label: 'South America' },
								{ value: 'EU', label: 'Europe' },
								{ value: 'AS', label: 'Asia' },
								{ value: 'OC', label: 'Oceania' },
								{ value: 'AF', label: 'Africa' },
								{ value: 'AN', label: 'Antarctica' },
							]}
							getOptionLabel={x => `${continentMap[x.value]} (${x.value})`}
							classNamePrefix='select'
							name='key'
							className='basic-multi-select'
						/>
					</td>
				</>
			);
			break;
		case 'redirect':
			mapInfoHelper = <div className='alert alert-info' role='info'>
				Redirects redirect all requests from a domain to another domain or a domain+path e.g. &quot;www.example.com&quot; -&gt; &quot;example.com&quot; or &quot;example.com/something&quot;.
			</div>;
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<input className='form-control' type='text' name='key' placeholder='domain' required />
					</td>
					<td>
						<input className='form-control' type='text' name='value' placeholder='domain or domain/path' required />
					</td>
				</>
			);
			break;
		case 'rewrite':
			mapInfoHelper = <div className='alert alert-info' role='info'>
				Rewrites redirect a specific path to another path e.g. &quot;example.com/blog&quot; -&gt; &quot;example.com/new-blog&quot;.
			</div>;
			formElements = (
				<>
					<td>
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					</td>
					<td>
						<input className='form-control' type='text' name='key' placeholder='domain' required />
					</td>
					<td>
						<input className='form-control' type='text' name='value' placeholder='domain or domain/path' required />
					</td>
				</>
			);
			break;
	}

	return (
		<>

			<Head>
				<title>
					{mapInfo.fname}
				</title>
			</Head>

			{/* Map friendly name (same as shown on acc page) */}
			<h5 className='fw-bold'>
				{mapInfo.fname}:
			</h5>

			{mapInfoHelper}

			<SearchFilter filter={filter} setFilter={setFilter} />

			{/* Map table */}
			<div className='w-100 round-shadow'>
				<form onSubmit={addToMap} className='d-flex' action={`/forms/map/${mapInfo.name}/add`} method='post'>
					<table className='table text-nowrap mb-0'>
						<tbody>

							{/* header row */}
							<tr>
								<th style={{width:0}} />
								<th>
									{mapInfo.columnNames[0]}
								</th>
								{(showValues === true || mapInfo.showAllColumns === true) && mapInfo.columnNames.slice(1).map((x, mci) => (
									<th key={`mci_${mci}`}>
										{x}
									</th>
								))}
								
							</tr>

							{mapRows}

							{/* Add new row form */}
							<tr className='align-middle'>
								{formElements}
							</tr>

						</tbody>
					</table>
				</form>
			</div>

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* back to account */}
			<BackButton to='/account' />

		</>
	);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: res.locals.data };
}

export default MapPage;
