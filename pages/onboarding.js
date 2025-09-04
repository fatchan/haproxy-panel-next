import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import NProgress from 'nprogress';
import withAuth from '../components/withAuth.js';

function Onboarding(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [loading, setLoading] = useState({});
	const [error, setError] = useState();
	const [csrState, setCsrState] = useState();

	async function fetchOnboarding(key) {
		key && setLoading(oldLoading => ({ ...oldLoading, [key]: true }));
		try {
			await API.getOnboarding(async res => {
				dispatch(res);
				key && setLoading(oldLoading => ({ ...oldLoading, [key]: false }));
			}, setError, router);
		} finally {
			await new Promise(res => setTimeout(res, 1000));
			key && setLoading(oldLoading => ({ ...oldLoading, [key]: false }));
		}
	}

	useEffect(() => {
		if (state.hasBackend == null) {
			fetchOnboarding();
		}
	}, [state.user, state.maps, router]);

	useEffect(() => {
		const interval = setInterval(fetchOnboarding, 60000);
		return () => {
			clearInterval(interval);
		};
	}, []);

	const { user, maps, csrf, txtRecords, hasBackend, nameserversPropagated } = state;

	const memoizedTxtRecords = useMemo(() => {
		return (txtRecords || [])
			.reduceRight((p, v, i, a) => (v = i ? ~~(Math.random() * (i + 1)) : i, v - i ? [a[v], a[i]] = [a[i], a[v]] : 0, a), [])
			.map(r => <li suppressHydrationWarning key={r}>{r}</li>);
	}, [txtRecords?.length]);

	if (user == null || !txtRecords || txtRecords.length === 0) {
		return (
			<div className='d-flex flex-column'>
				{error && <ErrorAlert error={error} />}
				<div className='text-center mb-4'>
					<div className='spinner-border mt-5' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	const domainAdded = user.domains && user.domains.length > 0;
	const backendMap = maps && maps.find(m => m.name === 'hosts');
	const backendAdded = backendMap && backendMap.count > 0 && hasBackend === true;
	const certAdded = user.numCerts && user.numCerts > 0;

	async function updateOnboarding(step) {
		await API.updateOnboarding({
			step
		}, dispatch, setError, router);
		await API.getAccount(dispatch, setError, router);
	}

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

	async function verifyCSR(e) {
		e.preventDefault();
		setError(null);
		await API.verifyCSR({
			_csrf: csrf,
			csr: e.target.csr.value,
			json: true,
		}, setCsrState, setError, router);
		NProgress.done(true);
	}

	return (<>

		<Head>
			<title>Onboarding</title>
		</Head>

		{error && <ErrorAlert error={error} />}

		<h5 className='fw-bold'>
			Onboarding
			{user.onboarding === false && <div className='my-2'>
				<input onClick={() => {
					if (confirm('Are you sure you want to skip onboarding?')) {
						updateOnboarding(7);
					}
				}} className='btn btn-sm btn-warning' type='submit' value='Skip Onboarding' />
			</div>}
		</h5>

		<div className='list-group'>
			<div className='list-group-item d-flex gap-3'>
				<input className='form-check-input flex-shrink-0' type='checkbox' value='' checked={domainAdded} disabled />
				<span className='pt-1 form-checked-content'>
					<strong suppressHydrationWarning style={{ textDecoration: domainAdded ? 'line-through' : '' }}>
						<i className='bi-card-list pe-none me-2' width='1em' height='1em' />
						1. Add a domain
					</strong>
					{!domainAdded && <>
						<span className='d-block text-body-secondary mt-3'>
							<p>Add your first domain (i.e. <code>example.com</code>) that you want to protect.</p>
							<p>You can add other domains and/or subdomains later from the &quot;domains&quot; page.</p>
						</span>
						<form className='mb-3' onSubmit={addDomain} action='/forms/domain/add' method='post'>
							<input type='hidden' name='_csrf' value={csrf} />
							<input type='hidden' name='onboarding' value='1' />
							<input className='form-control mb-3' type='text' name='domain' placeholder='domain' disabled={domainAdded} required />
							<input className='btn btn-success' type='submit' value='Add domain' disabled={domainAdded} />
						</form>
					</>}
					{domainAdded && (<div><strong>
						<i className='bi-check-circle-fill me-2' style={{ color: 'green' }} width='1em' height='1em' />
						Domain added successfully
					</strong></div>)}
				</span>
			</div>
			<div className='list-group-item d-flex gap-3'>
				<input className='form-check-input flex-shrink-0' type='checkbox' value='' checked={nameserversPropagated} disabled />
				<span className='pt-1 form-checked-content'>
					<strong suppressHydrationWarning style={{ textDecoration: nameserversPropagated ? 'line-through' : '' }}>
						<i className='bi-globe2 pe-none me-2' width='1em' height='1em' />
						2. Update the nameservers for your domain to the following:
					</strong>
					<span className='d-block text-body-secondary mt-3'>
						<ul>
							{memoizedTxtRecords}
						</ul>
					</span>
					<span className='d-block text-body-secondary mt-3'>
						<p>This is usually done through your domain registrar. Using at least 2 nameservers is recommended for redundancy.</p>
					</span>
					{nameserversPropagated && (<div><strong>
						<i className='bi-check-circle-fill me-2' style={{ color: 'green' }} width='1em' height='1em' />
						Nameservers configured successfully
					</strong></div>)}
				</span>
			</div>
			<div className='list-group-item d-flex gap-3'>
				<span className='flex-shrink-0 mx-1 mt-2'>&bull;</span>
				<span className='pt-1 form-checked-content'>
					<strong>
						<i className='bi-globe2 pe-none me-2' width='1em' height='1em' />
						3. Create DNS Records
					</strong>
					<span className='d-block text-body-secondary mt-3'>
						<p>On the <Link href='/domains' passHref target='_blank'>Domains</Link> page, edit the DNS for your domain and add any &quot;A&quot; type records using the templates.</p>
						<p>The &quot;name&quot; field for <code>example.com</code> should be &quot;@&quot;, and for subdomains e.g. <code>www.example.com</code> it should be the subdomain &quot;www&quot;.</p>
					</span>
				</span>
			</div>
			<div className='list-group-item d-flex gap-3'>
				<input className='form-check-input flex-shrink-0' type='checkbox' value='' checked={nameserversPropagated} disabled />
				<span className='pt-1 form-checked-content'>
					<strong suppressHydrationWarning style={{ textDecoration: nameserversPropagated ? 'line-through' : '' }}>
						<i className='bi-hourglass-split pe-none me-2' width='1em' height='1em' />
						4. Wait for the nameserver and DNS updates to propagate.
					</strong>
					{!nameserversPropagated && <>
						<span className='d-block text-body-secondary mt-3'>
							<p>This may take up to 48 hours depending on your domain registrar, but typically starts working within 30 minutes.</p>
							<p>You can use these external tools to check the propagation of the DNS:</p>
							<ul>
								<li><a rel='noreferrer' target='_blank' href='https://ping.sx/dig'>{'https://ping.sx/dig'}</a></li>
								<li><a rel='noreferrer' target='_blank' href='https://www.whatsmydns.net/'>{'https://www.whatsmydns.net/'}</a></li>
								<li><a rel='noreferrer' target='_blank' href='https://dnschecker.org/'>{'https://dnschecker.org/'}</a></li>
							</ul>
						</span>
					</>}
					<span className='d-block text-body-secondary mt-3'>
						<input onClick={() => {
							fetchOnboarding('nameservers');
						}} className='btn btn-sm btn-info' type='submit' value='Check Propagation' disabled={loading['nameservers']} />
						{loading['nameservers'] && <div className='spinner-border ms-2' role='status' style={{ width: 15, height: 15 }} />}
					</span>
					{nameserversPropagated && (<div><strong>
						<i className='bi-check-circle-fill me-2' style={{ color: 'green' }} width='1em' height='1em' />
						Nameserver changes propagated successfully
					</strong></div>)}
				</span>
			</div>
			{<div className='list-group-item d-flex gap-3'>
				<input className='form-check-input flex-shrink-0' type='checkbox' value='' checked={backendAdded} disabled />
				<span className='pt-1 form-checked-content'>
					<strong suppressHydrationWarning style={{ textDecoration: backendAdded ? 'line-through' : '' }}>
						<i className='bi-hdd-network-fill pe-none me-2' width='1em' height='1em' />
						5. Add a backend
					</strong>
					{!backendAdded && <>
						<span className='d-block text-body-secondary mt-3'>
							<p>Enter the backend server IP address and port in ip:port format, e.g. <code>12.34.56.78:443</code>.</p>
							<p>This is the &quot;origin&quot; that you want to proxy traffic to.</p>
						</span>
						<form onSubmit={addToMap} className='mb-3' action='/forms/map/hosts/add' method='post'>
							<input type='hidden' name='_csrf' value={csrf} />
							<input type='hidden' name='onboarding' value='1' />
							<select className='form-select mb-3' name='key' defaultValue=''
								disabled={backendAdded}
								required>
								<option value=''>select domain</option>
								{(user.domains || []).map((d, i) => (<option key={'option' + i} value={d}>{d}</option>))}
							</select>
							<input
								className='form-control mb-3'
								type='text'
								name='value'
								placeholder='backend ip:port'
								disabled={backendAdded}
								required
							/>
							<input className='btn btn-success' type='submit' value='Add backend' disabled={backendAdded} />
						</form>
					</>}
					{backendAdded === true && (<div><strong>
						<i className='bi-check-circle-fill me-2' style={{ color: 'green' }} width='1em' height='1em' />
						Backend server successfully added
					</strong></div>)}
				</span>
			</div>}
			<div className='list-group-item d-flex gap-3'>
				<input className='form-check-input flex-shrink-0' type='checkbox' value='' checked={certAdded} disabled />
				<span className='pt-1 form-checked-content'>
					<strong suppressHydrationWarning style={{ textDecoration: certAdded ? 'line-through' : '' }}>
						<i className='bi-file-earmark-lock-fill pe-none me-2' width='1em' height='1em' />
						6. Generate HTTPS certificate
					</strong>
					{!certAdded && <>
						<span className='d-block text-body-secondary mt-3'>
							<p>The backend will trigger a call to <a href='https://letsencrypt.org/' rel='noreferrer' target='_blank'>Let&apos;s Encrypt</a> to issue a HTTPS certificate.</p>
							<p>This certificate will be automatically installed on the edge and visitors will be connected securely.</p>
							<p>Certificates last 90 days and will automatically renew when they have less than 30 days remaining.</p>
							<p>You can manage certificates later from the &quot;HTTPS Certificates&quot; page.</p>
						</span>
						<form className='mb-3' onSubmit={addCert} action='/forms/cert/add' method='post'>
							<input type='hidden' name='_csrf' value={csrf} />
							<input type='hidden' name='onboarding' value='1' />
							<input className='form-control mb-3' type='text' name='subject' placeholder='domain.com' disabled={certAdded} required />
							<textarea
								className='form-control mb-3'
								name='altnames'
								placeholder={'www.domain.com\r\ntest.example.com\r\netc...'}
								rows={4}
								required />
							<input className='btn btn-success' type='submit' value='Generate certificate' disabled={certAdded} />
						</form>
					</>}
					{certAdded && (<div><strong>
						<i className='bi-check-circle-fill me-2' style={{ color: 'green' }} width='1em' height='1em' />
						HTTPS Certificate successfully generated
					</strong></div>)}
				</span>
			</div>
			<div className='list-group-item d-flex gap-3'>
				<input className='form-check-input flex-shrink-0' type='checkbox' value='' checked={certAdded} disabled />
				<span className='pt-1 form-checked-content'>
					<strong>
						<i className='bi-building-fill-lock pe-none me-2' width='1em' height='1em' />
						8. Get your HTTPS CSR signed
					</strong>
					<span className='d-block text-body-secondary mt-3'>
						<p>Finally, generate a certificate signing request for your origin server(s) and have it signed by the {process.env.NEXT_PUBLIC_APP_NAME} certificate authority.</p>
						<p>This allows the edge servers to verify their connection to your backend, protecting against simple man-in-the-middle attacks and other vulnerabilities that can occur with self-signed certificates, insecure connections, or so-called &apos;flexible&apos; SSL modes.</p>
						<ol className='text-break'>
							<li>Generate the private key and certificate signing request for your domains on your origin server:
								<p>
									<code>
										{'openssl req -newkey rsa:4096 -new -nodes -subj "/CN='}<strong>yourdomain.com</strong>{'/OU=OrganisationUnit/O=Organisation/L=Locality/ST=St/C=Co" -sha256 -extensions v3_req -reqexts SAN -keyout origin.key -out origin.csr -config <(cat /etc/ssl/openssl.cnf \<\(printf "[SAN]\\nsubjectAltName=DNS:'}<strong>yourdomain.com</strong>{',DNS:'}<strong>www.yourdomain.com</strong>{'"))'}
									</code>
								</p>
								Make sure to replace yourdomain.com and www.yourdomain.com. It&apos;s also recommended to put the correct organisational unit, locality, state and country.
							</li>
							<li>After generating, you will have two files: <code>origin.key</code> (your private key) and <code>origin.csr</code> (the certificate signing request).</li>
							<li>Copy the contents of <code>origin.csr</code> into the box below. After submitting the form, save the output to <code>origin.crt</code></li>
							<li>You can then setup <code>origin.key</code> and <code>origin.crt</code>, as the key and certificate respectively, in your origin web server.</li>
						</ol>
						<p>See the <Link href='/kb/https' passHref target='_blank'>HTTPS & CSRs knowledgebase article</Link> for more information.</p>
					</span>
					<form onSubmit={verifyCSR} className='mb-3' action='/forms/csr/verify' method='post'>
						<input type='hidden' name='_csrf' value={csrf} />
						<textarea
							className='form-control mb-3'
							name='csr'
							placeholder={'-----BEGIN CERTIFICATE REQUEST-----\n...'}
							rows={4}
							required />
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-1' width='16' height='16' />
							Verify CSR
						</button>
					</form>
					{csrState && csrState.csr && <div>
						<div className='mb-2'>
							<label className='form-label w-100'>Here&apos;s your certificate:
								<textarea
									className='form-control'
									name='csr'
									value={csrState.csr}
									rows={10}
									readOnly
									required />
							</label>
						</div>
					</div>}
				</span>
			</div>
			<div className='list-group-item d-flex gap-3 justify-content-center'>
				<strong>That&apos;s it!</strong>
			</div>
		</div>

	</>);
}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
};

export default withAuth(Onboarding);
