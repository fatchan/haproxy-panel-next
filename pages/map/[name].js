import { useRouter } from "next/router";
import React, { useState, useContext, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MapRow from '../../components/MapRow.js';
import BackButton from '../../components/BackButton.js';
import ErrorAlert from '../../components/ErrorAlert.js';
import * as API from '../../api.js';
import { GlobalContext } from '../../providers/GlobalProvider.js';

const MapPage = (props) => {

	const router = useRouter();
	const { name: mapName } = router.query;
	const [state, dispatch] = useContext(GlobalContext);
	const [error, setError] = useState();
	const changedMap = state.mapId?.name != mapName;

	useEffect(() => {
		if (props.map != null) {
			dispatch({ type: 'state', payload: props });
		} else {
			//TODO: eventually, keep all visited maps in the context and refresh on load like e.g. clusters
			API.getMap(mapName, dispatch, setError, router);
		}
	}, [changedMap, mapName, dispatch, props, router]);

	if (state.map == null || changedMap) {
		return (
			<>
				Loading...
				{error && <ErrorAlert error={error} />}
			</>
		);
	}

	const { user, mapValueNames, mapId, map, csrf, name, showValues } = state;

	async function addToMap(e) {
		e.preventDefault();
		await API.addToMap(mapId.name, { _csrf: csrf, key: e.target.key.value, value: e.target.value?.value }, dispatch, setError, router);
		await API.getMap(mapName, dispatch, setError, router);
		e.target.reset();
	}

	async function deleteFromMap(e) {
		e.preventDefault();
		await API.deleteFromMap(mapId.name, { _csrf: csrf, key: e.target.key.value }, dispatch, setError, router);
		await API.getMap(mapName, dispatch, setError, router);
	}

	const mapRows = map.map((row, i) => {
		return (
			<MapRow
				key={i}
				row={row}
				onDeleteSubmit={deleteFromMap}
			/>
		)
	});


	let formElements;
	//TODO: env var case map names
	switch (mapId.name) {
		case "ddos": {
			const mapValueOptions = Object.entries(mapValueNames)
				.map((entry, i) => (<option key={'option'+i} value={entry[0]}>{entry[1]}</option>))
			formElements = (
				<>
					<input type="hidden" name="_csrf" value={csrf} />
					<input className="btn btn-success" type="submit" value="+" />
					<input className="form-control mx-3" type="text" name="key" placeholder="domain/path" required />
					<select className="form-select mx-3" name="value" required>
						<option selected />
						{mapValueOptions}
					</select>
				</>
			);
			break;
		}
		case "hosts":
		case "maintenance": {
			const activeDomains = map.map(e => e.split(' ')[1]);
			const inactiveDomains = user.domains.filter(d => !activeDomains.includes(d));
			const domainSelectOptions = inactiveDomains.map((d, i) => (<option key={'option'+i} value={d}>{d}</option>));
			formElements = (
				<>
					<input type="hidden" name="_csrf" value={csrf} />
					<input className="btn btn-success" type="submit" value="+" />
					<select className="form-select mx-3" name="key" required>
						<option selected />
						{domainSelectOptions}
					</select>
				</>
			);
			break;
		}
		case "blocked":
		case "whitelist":
			formElements = (
				<>
					<input type="hidden" name="_csrf" value={csrf} />
					<input className="btn btn-success" type="submit" value="+" />
					<input className="form-control mx-3" type="text" name="key" placeholder="ip or subnet" required />
				</>
			);
			break;
	}

	return (
		<>

			<Head>
				<title>
					{mapId.fname}
				</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			{/* Map friendly name (same as shown on acc page) */}
			<h5 className="fw-bold">
				{mapId.fname}:
			</h5>

			{/* Map table */}
			<div className="table-responsive">
				<table className="table table-bordered text-nowrap">
					<tbody>

						{/* header row */}
						{mapRows.length > 0 && (
							<tr>
								<th />
								<th>
									{mapId.columnNames[0]}
								</th>
								{showValues === true && (
									<th>
										{mapId.columnNames[1]}
									</th>
								)}
							</tr>
						)}
						
						{mapRows}

						{/* Add new row form */}
						<tr className="align-middle">
							<td className="col-1 text-center" colSpan="3">
								<form onSubmit={addToMap} className="d-flex" action={`/forms/map/${mapId.name}/add`} method="post">
									{formElements}
								</form>
							</td>
						</tr>
						
					</tbody>
				</table>
			</div>

			{/* back to account */}
			<BackButton to="/account" />
			
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
