import React from 'react';
import withAuth from '../components/withAuth';
import MapContainer from '../components/MapContainer';
import BackButton from '../components/BackButton';
import Head from 'next/head';
import InfoAlert from '../components/InfoAlert';

function BlacklistPage() {

  return (
    <>
      <Head><title>Blacklist</title></Head>
      <h5 className="fw-bold">Blacklist:</h5>
      <InfoAlert>Block IPs, subnets, ASNs, countries or continents.</InfoAlert>

      <MapContainer mapName={'blockedip'} minimal />
      <MapContainer mapName={'blockedasn'} minimal />
      <MapContainer mapName={'blockedcc'} minimal />
      <MapContainer mapName={'blockedcn'} minimal />
      <BackButton to="/dashboard" />
    </>
  );
}

export async function getServerSideProps({ res }) {
  return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(BlacklistPage);

