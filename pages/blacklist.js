import React, { useState } from 'react';
import withAuth from '../components/withAuth';
import MapContainer from '../components/MapContainer';
import BackButton from '../components/BackButton';
import Head from 'next/head';
import InfoAlert from '../components/InfoAlert';
import MapNameSelect from '../components/MapNameSelect';
import MapFormFields from '../components/MapFormFields';
import * as API from '../api.js';
import { fMap } from '../util.js';
import ErrorAlert from '../components/ErrorAlert.js';
import { useRouter } from 'next/router.js';

function BlacklistPage(props) {

	const router = useRouter();
	const [mapName, setMapName] = useState('blockedip');
	const [state, setState] = useState(props);
	const [error, setError] = useState();
	const { user, csrf } = state || {};

	async function addToMap(e) {
		e.preventDefault();
		setError();
		await API.addToMap(mapName, {
			_csrf: csrf,
			key: e.target.key?.value,
			note: e.target.node?.value,
		}, setState, setError, null);
		await API.getMap(mapName, setState, setError, router);
		e.target.reset();
	};

	return (
		<>

			<Head><title>Blacklist</title></Head>
			<h5 className='fw-bold'>Blacklist:</h5>
			<InfoAlert>Block IPs, subnets, ASNs, countries or continents.</InfoAlert>

			<div className='round-border'>
				<MapContainer mapName={'blockedip'} minimal />
				<MapContainer mapName={'blockedasn'} minimal />
				<MapContainer mapName={'blockedcc'} minimal />
				<MapContainer mapName={'blockedcn'} minimal />
			</div>

			{error && <ErrorAlert error={error} />}

			<div className='w-100 table-responsive round-border mt-3'>
				<form onSubmit={addToMap} className='d-flex'>
					<table className='table text-nowrap mb-0'>
						<tbody>
							<tr className='align-middle'>
								<td>
									<button className='btn btn-sm btn-success' type='submit'>
										<i className='bi-plus-lg pe-none' width='16' height='16' />
									</button>
								</td>
								<td style={{ width: 180, minWidth: 180 }}>
									<MapNameSelect
										value={mapName}
										onChange={setMapName}
									/>
								</td>
								<MapFormFields
									formType='add'
									mapName={fMap[mapName].name}
									user={user}
									noButtons
								/>
							</tr>
						</tbody>
					</table>
				</form>
			</div>

			<BackButton to='/dashboard' />

		</>
	);
}

export async function getServerSideProps({ res }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(BlacklistPage);

