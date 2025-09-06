import React from 'react';
import withAuth from '../../components/withAuth';
import MapContainer from '../../components/MapContainer';
import BackButton from '../../components/BackButton';
import { useRouter } from 'next/router';

function MapPage(props) {

	const router = useRouter();
	const { name: mapName } = router.query;
	const initialData = props?.mapInfo?.name === mapName ? props : undefined;

	return (
		<>
			<MapContainer mapName={mapName} initialData={initialData} />
			<BackButton to="/dashboard" />
		</>
	);
}

export async function getServerSideProps({ res }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(MapPage);
