import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import MapRow from '../../components/MapRow.js';
import MapFormFields from '../../components/MapFormFields.js'; // Import the new component
import BackButton from '../../components/BackButton.js';
import ErrorAlert from '../../components/ErrorAlert.js';
import SearchFilter from '../../components/SearchFilter.js';
import * as API from '../../api.js';

import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
countries.registerLocale(enCountries);

const MapPage = (props) => {
	const router = useRouter();
	const { name: mapName } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState('');
	const changedMap = state.mapInfo?.name !== mapName;

	useEffect(() => {
		if (!state.map || changedMap) {
			API.getMap(mapName, dispatch, setError, router);
		}
	}, [state.map, mapName, router, changedMap]);

	const [editValue, setEditValue] = useState({});

	const handleFieldChange = (field, newValue) => {
		setEditValue((prev) => ({
			...prev,
			[field]: newValue,
		}));
	};

	const { user, mapValueNames, mapInfo, map, csrf, showValues, mapNotes } = state || {};

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

	async function addToMap(e) {
		e.preventDefault();
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
