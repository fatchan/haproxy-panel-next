import { useRouter } from "next/router";
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MapRow from '../../components/MapRow.js';
import BackButton from '../../components/BackButton.js';

const MapPage = (props) => {

	const router = useRouter();
	const { name: mapName } = router.query;

	const [mapData, setMapData] = useState(props);

    React.useEffect(() => {
    	if (!mapData.user) {
			async function getAccount() {
				const response = await fetch(`/map/${mapName}.json`)
					.then(res => res.json());
				console.log(response)
				setMapData(response);
	    	}
	    	getAccount();
	    }
    }, []);

	if (!mapData.user) {
	    return <>Loading...</>;
	}

	const { user, mapValueNames, mapId, map, csrf, name, showValues } = mapData;

	const mapRows = map.map((row, i) => {
		//todo: address prop drilling
		return (
			<MapRow
				key={i}
				row={row}
				name={mapId.name}
				csrf={csrf}
				showValues={showValues}
				mapValueNames={mapValueNames}
			/>
		)
	});

	let formElements;
	//todo: env var case map names
	switch (mapId.name) {
		case "ddos":
			formElements = (
				<>
					<input type="hidden" name="_csrf" value={csrf} />
					<input className="btn btn-success" type="submit" value="+" />
					<input className="form-control mx-3" type="text" name="key" placeholder="ip or subnet" required />
				</>
			);
			break;
		case "hosts":
		case "maintenance":
			break;
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

			{/* Map friendly name (same as shown on acc page) */}
			<h5 className="fw-bold">
				{mapId.fname}:
			</h5>

			{/* Map table */}
			<div className="table-responsive">
				<table className="table table-bordered text-nowrap">
					<tbody>

						{/* header row */}
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
						
						{mapRows}

						{/* Add new row form */}
						<tr className="align-middle">
							<td className="col-1 text-center" colSpan="3">
								<form className="d-flex" action={`/map/${mapId.name}/add`} method="post">
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
