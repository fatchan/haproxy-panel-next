import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MapLink from '../components/MapLink.js';

const Account = (props) => {

	const [accountData, setAccountData] = useState(props);

    React.useEffect(() => {
    	if (!accountData.user) {
			async function getAccount() {
				const response = await fetch('/account.json')
					.then(res => res.json());
				setAccountData(response);
	    	}
	    	getAccount();
	    }
    }, []);

	if (!accountData.user) {
	    return <>Loading...</>;
	}

	const { user, maps, acls, globalAcl, csrf } = accountData;

	// isAdmin for showing global override option
	const isAdmin = user.username === 'admin';

	// Next cluster number for > browse button
	const nextCluster = user.clusters[user.activeCluster+1] ? user.activeCluster+1 : 0

	// Links to each map and bubble/pill for map counts
	const mapLinks = maps.map((map, i) => <MapLink key={i} map={map} />);

	return (
		<>
		
			<Head>
				<title>Account</title>
			</Head>

			<h5 className="fw-bold">
				Controls:
			</h5>
			
			<div className="list-group">
			
				{/* Global overide */}
				{isAdmin === true && (
					<div className="list-group-item d-flex align-items-center">
						<div className="ms-2 me-auto d-flex align-items-center gap-2">
							<span className="fw-bold">
								Global Override
							</span>
							<form action="/global/toggle" method="post">
								<input type="hidden" name="_csrf" value={csrf} />
								<input className="btn btn-sm btn-primary" type="submit" value="Toggle" />
							</form>
						</div>
						<div className={`badge rounded-pill bg-${globalAcl?'success':'dark'}`}>
							{globalAcl?'ON':'OFF'}
						</div>
					</div>
				)}
				
				{/* Manage Clusters */}
				<div className="list-group-item list-group-item-action d-flex align-items-start flex-column">
					<div className="flex-row d-flex w-100">
						<div className="ms-2 me-auto">
							<div className="fw-bold">
								Manage Clusters
								<span className="fw-normal">
									{' '}- Add/Delete/Select a cluster
								</span>
							</div>
						</div>
						<span className="ml-auto badge bg-info rounded-pill">
							Cluster: 1
						</span>
					</div>
					<div className="d-flex w-100 justify-content-between mt-2">
						<div className="ms-2">
							<div className="fw-bold">
								Servers ({user.clusters[user.activeCluster].split(',').length})
								<span className="fw-normal">
									: {user.clusters[user.activeCluster]}
								</span>
							</div>
						</div>
						<span className="ml-auto d-flex flex-row">
							<form action="/cluster" method="post">
								<input type="hidden" name="_csrf" value={csrf}/>
								<input type="hidden" name="cluster" value={nextCluster}/>
								<input className="btn btn-primary px-2 py-0" type="submit" value="&gt;"/>
							</form>
							<Link href="/clusters">
								<a className="btn btn-success px-2 py-0 ms-2">
									+
								</a>
							</Link>
						</span>
					</div>
				</div>
				
				{/* Available domains */}
				<Link href="/domains">
					<a className="list-group-item list-group-item-action d-flex align-items-start">
						<div className="ms-2 me-auto">
							<div className="fw-bold">
								Available Domains
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
				
			</div>

			{/* Map links */}
			{mapLinks}
			
		</>
	)
};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
}

export default Account;
