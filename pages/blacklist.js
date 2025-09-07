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
// import { useRouter } from 'next/router.js';

function BlacklistPage(props) {

	// const router = useRouter();
	const [mapName, setMapName] = useState('blockedip');
	const [state, setState] = useState(props);
	const [error, setError] = useState();
	const [editValue, setEditValue] = useState({});
	const [refresh, setRefresh] = useState({});
	const { user, csrf } = state || {};

	const handleFieldChange = (field, newValue) => {
		setEditValue(prev => ({ ...prev, [field]: newValue }));
	};

	async function addToMap(e) {
		e.preventDefault();
		setError();
		await API.addToMap(mapName, {
			_csrf: csrf,
			...editValue,
		}, setState, setError, null);
		// await API.getMap(mapName, setState, setError, router);
		setRefresh({
			...refresh,
			[mapName]: Date.now(),
		}); // hmmm
		e.target.reset();
		setEditValue({});
	};

	return (
		<>

			<Head><title>Blacklist</title></Head>
			<h5 className='fw-bold'>Blacklist:</h5>
			<InfoAlert>Block IPs, subnets, ASNs, countries or continents.</InfoAlert>

			<div className='round-border'>
				<MapContainer mapName={'blockedip'} minimal refresh={refresh} />
				<MapContainer mapName={'blockedasn'} minimal refresh={refresh} />
				<MapContainer mapName={'blockedcc'} minimal refresh={refresh} />
				<MapContainer mapName={'blockedcn'} minimal refresh={refresh} />
			</div>

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
									handleFieldChange={handleFieldChange}
									editValue={editValue}
								/>
							</tr>
						</tbody>
					</table>
				</form>
			</div>

			{error && <div className='mt-3'><ErrorAlert error={error} /></div>}

			<BackButton to='/dashboard' />

		</>
	);
}

export async function getServerSideProps({ res }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(BlacklistPage);

