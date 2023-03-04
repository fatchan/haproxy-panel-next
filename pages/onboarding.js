import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';

export default function Onboarding(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	useEffect(() => {
		if (!state.user) {
			API.getAccount(dispatch, setError, router);
		}
	}, [state.user, state.maps, router]);

	if (state.user == null) {
		return (
			<div className="d-flex flex-column">
				{error && <ErrorAlert error={error} />}
				<div className="text-center mb-4">
					Loading...
				</div>
			</div>
		);
	}

	const { user, maps, globalAcl, csrf } = state;
	const domainAdded = user.domains.length > 0;
	const backendMap = maps && maps.find(m => m.name === 'hosts');
	const backendAdded = backendMap && backendMap.count > 0;
	const certAdded = user.numCerts > 0;

	async function addDomain(e) {
		e.preventDefault();
		await API.addDomain({ _csrf: csrf, domain: e.target.domain.value, onboarding: e.target.onboarding.value }, dispatch, setError, router);
		await API.getAccount(dispatch, setError, router);
		e.target.reset();
	}

	async function addToMap(e) {
		e.preventDefault();
		await API.addToMap('hosts', { _csrf: csrf, key: e.target.key.value, value: e.target.value?.value, onboarding: e.target.onboarding.value }, dispatch, setError, router);
		await API.getAccount(dispatch, setError, router);
		e.target.reset();
	}

	async function addCert(e) {
		e.preventDefault();
		await API.addCert({
			_csrf: csrf,
			subject: e.target.subject.value,
			altnames: e.target.altnames.value.split(',').map(x => x.trim()),
			onboarding: e.target.onboarding.value,
		}, dispatch, setError, router);
		await API.getAccount(dispatch, setError, router);
		e.target.reset();
	}

	return (<>

		<Head>
			<title>Onboarding</title>
		</Head>

		{error && <ErrorAlert error={error} />}

		<h5 className="fw-bold">Onboarding</h5>
		<h6>(Under Construction... 🏗️)</h6>

		<div className="list-group">
			<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" checked={domainAdded} disabled />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-card-list pe-none me-2" width="1em" height="1em" />
						1. Add a domain
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>Add your first domain (i.e. <code>example.com</code>) that you want to protect with BasedFlare.</p>
						<p>You can add more domains later from the &quot;domains&quot; page.</p>
					</span>
					<form className="d-flex mb-3" onSubmit={addDomain} action="/forms/domain/add" method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="onboarding" value="1" />
						<input className="btn btn-success" type="submit" value="+" disabled={domainAdded} />
						<input className="form-control mx-3" type="text" name="domain" placeholder="domain" disabled={domainAdded} required />
					</form>
					{domainAdded && (<strong>
						<i className="bi-check-circle-fill me-2" style={{ color: 'green' }}  width="1em" height="1em" />
						Domain added successfully
					</strong>)}
				</span>
			</div>
			<div className="list-group-item d-flex gap-3">
				<span className="flex-shrink-0 mx-1 mt-2">&bull;</span>
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-globe2 pe-none me-2" width="1em" height="1em" />
						2. Update DNS records
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>Set the following A and AAAA records for your domain with your DNS provider:</p>
						<code>A</code>:
						<ul>
							<li>45.88.201.168</li>
							<li>185.125.168.21</li>
							<li>38.60.199.224</li>
						</ul>
						<code>AAAA</code> (optional, recommended):
						<ul>
							<li>2a03:94e1:ffff:45:88:201:0:168</li>
							<li>2a03:94e0:ffff:185:125:168:0:21</li>
						</ul>
					</span>
				</span>
			</div>
			<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" checked={backendAdded} disabled />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-hdd-network-fill pe-none me-2" width="1em" height="1em" />
						3. Connect to a backend
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>Enter the backend server IP address and port in ip:port format, e.g. <code>12.34.56.78:443</code>.</p>
						<p>This is the &quot;origin&quot; that you want BasedFlare to proxy traffic to.</p>
					</span>
					<form onSubmit={addToMap} className="d-flex mb-3" action='/forms/map/hosts/add' method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="onboarding" value="1" />
						<input className="btn btn-success" type="submit" value="+" disabled={backendAdded} />
						<select className="form-select mx-3" name="key" defaultValue="" disabled={backendAdded} required>
							<option value="">select domain</option>
							{user.domains.map((d, i) => (<option key={'option'+i} value={d}>{d}</option>))}
						</select>
						{
							(process.env.NEXT_PUBLIC_CUSTOM_BACKENDS_ENABLED) &&
							<input
								className="form-control ml-2"
								type="text"
								name="value"
								placeholder="backend ip:port"
								disabled={certAdded}
								required
							/>
						}
					</form>
					{backendAdded && (<strong>
						<i className="bi-check-circle-fill me-2" style={{ color: 'green' }}  width="1em" height="1em" />
						Backend server successfully added
					</strong>)}
				</span>
			</div>
			<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" checked={certAdded} disabled />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-file-earmark-lock-fill pe-none me-2" width="1em" height="1em" />
						4. Generate a HTTPS certificate
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>BasedFlare will generate and setup a HTTPS certificate for you using <a href="https://letsencrypt.org/" rel="noreferrer" target="_blank">Let&apos;s Encrypt</a>.</p>
						<p>Certificates last 90 days and will automatically renew when they have less than 30 days remaining.</p>
						<p>You can manage certificates later from the &quot;HTTPS Certificates&quot; page.</p>
					</span>
					<form className="d-flex mb-3" onSubmit={addCert} action="/forms/cert/add" method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="onboarding" value="1" />
						<input className="btn btn-success" type="submit" value="+" disabled={certAdded} />
						<input className="form-control mx-3" type="text" name="subject" placeholder="domain.com" disabled={certAdded} required />
						<input className="form-control me-3" type="text" name="altnames" placeholder="www.domain.com,staging.domain.com,etc..." disabled={certAdded} required />
					</form>
					{certAdded && (<strong>
						<i className="bi-check-circle-fill me-2" style={{ color: 'green' }}  width="1em" height="1em" />
						HTTPS Certificate successfully generated
					</strong>)}
				</span>
			</div>
			{domainAdded && backendAdded && certAdded && (<div className="list-group-item d-flex gap-3 justify-content-center">
				<strong>All done!</strong>
			</div>)}
		</div>

	</>);
}
