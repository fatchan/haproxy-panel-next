import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import MapRow from '../../components/MapRow.js';
import BackButton from '../../components/BackButton.js';
import ErrorAlert from '../../components/ErrorAlert.js';
import SearchFilter from '../../components/SearchFilter.js';
import * as API from '../../api.js';

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

	const { user, mapValueNames, mapInfo, map, csrf, showValues } = state;

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
					columnKeys={mapInfo.columnKeys}
				/>
			);
		});

	let formElements;
	//TODO: env var case map names
	switch (mapInfo.name) {
		case 'ddos': {
			const mapValueOptions = Object.entries(mapValueNames)
				.map((entry, i) => (<option key={'option'+i} value={entry[0]}>{entry[1]}</option>));
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
				</>
			);
			break;
		case 'redirect':
		case 'rewrite':
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

			<SearchFilter filter={filter} setFilter={setFilter} />

			{/* Map table */}
			<div className='table-responsive w-100'>
				<form onSubmit={addToMap} className='d-flex' action={`/forms/map/${mapInfo.name}/add`} method='post'>
					<table className='table text-nowrap mb-0'>
						<tbody>

							{/* header row */}
							<tr>
								<th style={{width:0}} />
								<th>
									{mapInfo.columnNames[0]}
								</th>
								{showValues === true && mapInfo.columnNames.slice(1).map((x, mci) => (
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
	return {
		props: {
			user: res.locals.user || null,
			...query
		}
	};
}

export default MapPage;
