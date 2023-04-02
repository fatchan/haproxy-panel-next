import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MapLink from '../components/MapLink.js';
import LoadingPlaceholder from '../components/LoadingPlaceholder.js';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';

export default function Account(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getAccount(dispatch, setError, router);
		}
	}, [state.user, router]);

	const loadingSection = useMemo(() => {
		return (
			<div className="list-group-item list-group-item-action d-flex align-items-start">
				<LoadingPlaceholder />
			</div>
		);
	}, []);

	let innerData;

	if (state.maps != null) {

		const { user, maps, globalAcl, csrf } = state;

		const isAdmin = user.username === 'admin';

		// Next cluster number for > browse button
		const nextCluster = user.clusters[user.activeCluster+1] ? user.activeCluster+1 : 0

		// Links to each map and bubble/pill for map counts
		const mapLinks = maps.map((map, i) => <MapLink key={i} map={map} />);

		async function switchCluster(e) {
			e.preventDefault();
			await API.changeCluster({ _csrf: csrf, cluster: nextCluster }, dispatch, setError, router);
			await API.getAccount(dispatch, setError, router);
		}

		async function toggleGlobal(e) {
			e.preventDefault();
			await API.globalToggle({ _csrf: csrf },dispatch, setError, router);
			await API.getAccount(dispatch, setError, router);
		}

		innerData = (
			<>

				{/* Global overide */}
				<div className="list-group-item d-flex align-items-center">
					<div className="ms-2 me-auto d-flex align-items-center gap-2">
						<span className="fw-bold">
							Global Override
						</span>
					</div>
					<form onSubmit={toggleGlobal} action="/forms/global/toggle" method="post" className="me-2">
						<input type="hidden" name="_csrf" value={csrf} />
						<input className="btn btn-sm btn-primary" type="submit" value="Toggle" />
					</form>
					<div className={`badge rounded-pill bg-${globalAcl?'success':'dark'}`}>
						{globalAcl?'ON':'OFF'}
					</div>
				</div>

				{/* Manage Clusters */}
				<div className="list-group-item list-group-item-action d-flex align-items-start flex-column">
					<div className="flex-row d-flex w-100">
						<div className="ms-2 me-auto">
							<div className="fw-bold">
								Manage Clusters
								<span className="fw-normal">
									{' '}- Add/Delete/Select cluster
								</span>
							</div>
						</div>
						<span className="ml-auto badge bg-info rounded-pill" style={{ maxHeight: "1.6em" }}>
							Cluster: {user.activeCluster+1}/{user.clusters.length}
						</span>
					</div>
					<div className="d-flex w-100 justify-content-between mt-2">
						<div className="ms-2 overflow-hidden">
							<div className="fw-bold overflow-hidden text-truncate">
								Cluster ({user.clusters.length === 0 ? 0 : user.clusters[user.activeCluster].split(',').length} servers)
								{user.clusters.length > 0 && (<span className="fw-normal">
									: {user.clusters[user.activeCluster].split(',').map(x => {
										const cUrl = new URL(x);
										return cUrl.hostname;
									}).join(', ')}
								</span>)}
							</div>
						</div>
						<span className="ml-auto d-flex flex-row">
							<form onSubmit={switchCluster} action="/forms/cluster" method="post">
								<input type="hidden" name="_csrf" value={csrf}/>
								<input type="hidden" name="cluster" value={nextCluster}/>
								<input className="btn btn-primary px-2 py-0" type="submit" value="&gt;" />
							</form>
							<Link href="/clusters">
								<a className="btn btn-success px-2 py-0 ms-2" style={{ maxHeight: "1.6em" }}>
									+
								</a>
							</Link>
						</span>
					</div>
				</div>

				{/* Domains */}
				<Link href="/domains">
					<a className="list-group-item list-group-item-action d-flex align-items-start">
						<div className="ms-2 me-auto">
							<div className="fw-bold">
								Domains
								<span className="fw-normal">
									{' '}- Domains you have permission over
								</span>
							</div>
						</div>
						<div className="badge bg-primary rounded-pill">
							{user.domains.length}
						</div>
					</a>
				</Link>

				{/* HTTPS certificates */}
				<Link href="/certs">
					<a className="list-group-item list-group-item-action d-flex align-items-start">
						<div className="ms-2 me-auto">
							<div className="fw-bold">
								HTTPS Certificates
								<span className="fw-normal">
									{' '}- Generated certs for your domains
								</span>
							</div>
						</div>
						<div className="badge bg-primary rounded-pill">
							{user.numCerts}
						</div>
					</a>
				</Link>

				{/* Origin CSR */}
				<Link href="/csr">
					<a className="list-group-item list-group-item-action d-flex align-items-start">
						<div className="ms-2 me-auto">
							<div className="fw-bold">
								Origin CSR
								<span className="fw-normal">
									{' '}- Sign CSR to get certs for your origins
								</span>
							</div>
						</div>
					</a>
				</Link>

				{/* Statistics 
				<Link href="/stats">
					<a className="list-group-item list-group-item-action d-flex align-items-start">
						<div className="ms-2 me-auto">
							<div className="fw-bold">
								Statistics
								<span className="fw-normal">
									{' '}- Statistics from cluster servers
								</span>
							</div>
						</div>
					</a>
				</Link>*/}

				{/* Map links */}
				{mapLinks}

			</>
		);

	} else {

		innerData = (
			<>
				{Array(12).fill(loadingSection)}
			</>
		);

	}

	return (
		<>

			<Head>
				<title>Account</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className="fw-bold">
				Account:
			</h5>

			<div className="list-group col-sm-12 col-xl-8 mx-auto">

			{innerData}

			</div>

		</>
	)
};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
};
