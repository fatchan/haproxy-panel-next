import { useRouter } from "next/router";
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import MapRow from '../../components/MapRow.js';
import BackButton from '../../components/BackButton.js';
import ErrorAlert from '../../components/ErrorAlert.js';
import * as API from '../../api.js';

const MapPage = (props) => {

	const router = useRouter();
	const { name: mapName } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const changedMap = state.mapInfo?.name != mapName;

	useEffect(() => {
		if (!state.map || changedMap) {
			API.getMap(mapName, dispatch, setError, router);
		}
	}, [state.map, mapName, router]);

	if (state.map == null || changedMap) {
		return (
			<div className="d-flex flex-column">
				{error && <ErrorAlert error={error} />}
				<div className="text-center mb-4">
					Loading...
				</div>
			</div>
		);
	}

	const { user, mapValueNames, mapInfo, map, csrf, showValues } = state;

	async function addToMap(e) {
		e.preventDefault();
		await API.addToMap(mapInfo.name, { _csrf: csrf, key: e.target.key.value, value: e.target.value?.value }, dispatch, setError, router);
		await API.getMap(mapName, dispatch, setError, router);
		e.target.reset();
	}

	async function deleteFromMap(e) {
		e.preventDefault();
		await API.deleteFromMap(mapInfo.name, { _csrf: csrf, key: e.target.key.value }, dispatch, setError, router);
		await API.getMap(mapName, dispatch, setError, router);
	}

	const mapRows = map.map((row, i) => {
		return (
			<MapRow
				key={i}
				row={row}
				name={mapInfo.name}
				csrf={csrf}
				showValues={showValues}
				mapValueNames={mapValueNames}
				onDeleteSubmit={deleteFromMap}
			/>
		)
	});


	let formElements;
	//TODO: env var case map names
	switch (mapInfo.name) {
		case "ddos": {
			const mapValueOptions = Object.entries(mapValueNames)
				.map((entry, i) => (<option key={'option'+i} value={entry[0]}>{entry[1]}</option>))
			formElements = (
				<>
					<input type="hidden" name="_csrf" value={csrf} />
					<input className="btn btn-success" type="submit" value="+" />
					<input className="form-control mx-3" type="text" name="key" placeholder="domain/path" required />
					<select className="form-select mx-3" name="value" defaultValue="" required>
						<option value="" />
						{mapValueOptions}
					</select>
				</>
			);
			break;
		}
		case "hosts":
		case "maintenance": {
			const activeDomains = map.map(e => e.key);
			const inactiveDomains = user.domains.filter(d => !activeDomains.includes(d));
			const domainSelectOptions = inactiveDomains.map((d, i) => (<option key={'option'+i} value={d}>{d}</option>));
			formElements = (
				<>
					<input type="hidden" name="_csrf" value={csrf} />
					<input className="btn btn-success" type="submit" value="+" />
					<select className="form-select mx-3" name="key" defaultValue="" required>
						<option value="" />
						{domainSelectOptions}
					</select>
					{
						(process.env.NEXT_PUBLIC_CUSTOM_BACKENDS_ENABLED && mapInfo.name === "hosts") &&
						<input
							className="form-control ml-2"
							type="text"
							name="value"
							placeholder="backend ip:port"
							required
						/>
					}
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
					{mapInfo.fname}
				</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			{/* Map friendly name (same as shown on acc page) */}
			<h5 className="fw-bold">
				{mapInfo.fname}:
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
									{mapInfo.columnNames[0]}
								</th>
								{showValues === true && (
									<th>
										{mapInfo.columnNames[1]}
									</th>
								)}
							</tr>
						)}

						{mapRows}

						{/* Add new row form */}
						<tr className="align-middle">
							<td className="col-1 text-center" colSpan="3">
								<form onSubmit={addToMap} className="d-flex" action={`/forms/map/${mapInfo.name}/add`} method="post">
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
