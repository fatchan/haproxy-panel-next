import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import MapRow from '../../components/MapRow.js';
import MapFormFields from '../../components/MapFormFields.js'; // Import the new component
import BackButton from '../../components/BackButton.js';
import ErrorAlert from '../../components/ErrorAlert.js';
import InfoAlert from '../../components/InfoAlert.js';
import SearchFilter from '../../components/SearchFilter.js';
import * as API from '../../api.js';

import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
countries.registerLocale(enCountries);

//TODO: move
const mapAlerts = {
	ddos: <>Select which domains or domain+paths have an interstitial bot-check page enabled. Recommended for the best protection and/or if you are frequently targeted by attacks.</>,
	ddos_config: <>Set the parameters of the bot check for a domain or domain+path.</>,
	blockedasn: <>Block entire networks containing multiple netblocks. Visit <a target='_blank' rel='noreferrer' href='https://bgp.tools'>bgp.tools</a> to search ASNs, or find the ASN of a particular IP address or netblock.</>,
	maintenance: <>Display a page letting your visitors know your site is undergoing maintenance or downtime.</>,
	images: <>Choose a custom remote URL for images displayed on edge pages e.g. bot-check, maintenance, etc.</>,
	blockedcc: <>Blocked countries based on geoip data. Uses <a target='_blank' rel='noreferrer' href='https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes'>ISO 3166-1 alpha-2 country codes</a>.</>,
	redirect: <>Redirects redirect all requests from a domain to another domain or a domain+path e.g. &quot;www.example.com&quot; -&gt; &quot;example.com&quot; or &quot;example.com/something&quot;.</>,
	rewrite: <>Rewrites redirect a specific path to another path e.g. &quot;example.com/blog&quot; -&gt; &quot;example.com/new-blog&quot;.</>,
};

const MapPage = (props) => {
	const router = useRouter();
	const { name: mapName } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState('');

	useEffect(() => {
		if (!state.map || (state.mapInfo && state.mapInfo.name !== mapName)) {
			API.getMap(mapName, dispatch, setError, router);
		}
	}, [state.map, mapName, router]);

	const [editValue, setEditValue] = useState({});

	const handleFieldChange = (field, newValue) => {
		setEditValue((prev) => ({
			...prev,
			[field]: newValue,
		}));
	};

	const { user, mapValueNames, mapInfo, map, csrf, showValues, mapNotes } = state || {};

	if (state.map == null) {
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

	async function addToMap(e) {
		e.preventDefault();
		console.log(editValue);
		await API.addToMap(mapInfo.name, {
			_csrf: csrf,
			...editValue,
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
			const rowValue = typeof row.value === 'object' ? Object.values(row.value) : row.value;
			return row.key.includes(filter) || rowValue.includes(filter);
		})
		.map((row, i) => {
			return (
				<MapRow
					key={`${i}_${JSON.stringify(row)}`}
					row={row}
					name={mapInfo.name}
					csrf={csrf}
					showValues={showValues}
					mapValueNames={mapValueNames}
					onDeleteSubmit={deleteFromMap}
					mapNote={mapNotes[row.key]}
					showNote={mapInfo.showAllColumns}
					columnKeys={mapInfo.columnKeys}
					setError={setError}
					user={user} // Pass user data for domain lists
				/>
			);
		});

	return (
		<>
			<Head>
				<title>{mapInfo.fname}</title>
			</Head>

			<h5 className='fw-bold'>{mapInfo.fname}:</h5>

			<InfoAlert>
				{mapAlerts[mapInfo.name]}
			</InfoAlert>

			<SearchFilter filter={filter} setFilter={setFilter} />

			{/* Map Table */}
			<div className='w-100 table-responsive round-border'>
				<form onSubmit={addToMap} className='d-flex'>
					<table className='table text-nowrap mb-0'>
						<tbody>
							{/* Header row */}
							<tr>
								<th style={{ width: 0 }} />
								<th>{mapInfo.columnNames[0]}</th>
								{(showValues === true || mapInfo.showAllColumns === true) &&
									mapInfo.columnNames.slice(1).map((x, mci) => (
										<th key={`mci_${mci}`}>{x}</th>
									))}
							</tr>

							{/* Existing Rows */}
							{mapRows}

							{/* Add New Row Form */}
							<tr className='align-middle'>
								<MapFormFields
									map={map}
									formType='add'
									mapName={mapInfo.name}
									mapValueNames={mapValueNames}
									user={user}
									editValue={editValue} // Empty object for no state (its a new row)
									handleFieldChange={handleFieldChange} // Null makes this uncontrolled to maintain old behaviour until i cba
								/>
							</tr>
						</tbody>
					</table>
				</form>
			</div>

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* Back Button */}
			<BackButton to='/account' />
		</>
	);
};

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: res.locals.data };
}

export default MapPage;
