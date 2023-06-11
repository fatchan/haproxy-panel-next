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
					<div className="spinner-border mt-5" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	const { user, maps, globalAcl, csrf, aRecords, aaaaRecords, txtRecords } = state;
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
						<p>You can add other domains and/or subdomains later from the &quot;domains&quot; page.</p>
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
						2. Update the nameservers for your domain to the following:
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<ul>
							{txtRecords
								.reduceRight((p,v,i,a)=>(v=i?~~(Math.random()*(i+1)):i, v-i?[a[v],a[i]]=[a[i],a[v]]:0, a),[])
								.map((r, i) => <li key={'a'+i}>{r}</li>)}
						</ul>
					</span>
					<span className="d-block text-body-secondary mt-3">
						<p>This is usually done through your domain registrar. Use all the nameservers, or as many as the registrar allows for your domain.</p>
					</span>
				</span>
			</div>
			<div className="list-group-item d-flex gap-3">
				<span className="flex-shrink-0 mx-1 mt-2">&bull;</span>
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-globe2 pe-none me-2" width="1em" height="1em" />
						3. Create DNS Records
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>On the <Link href="/domains" passHref><a target="_blank">Domains</a></Link> page, edit the DNS for your domain and add a &quot;A&quot; type record from the templates, with the name &quot;@&quot;.</p>
					</span>
				</span>
			</div>
			<div className="list-group-item d-flex gap-3">
				<span className="flex-shrink-0 mx-1 mt-2">&bull;</span>
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-hourglass-split pe-none me-2" width="1em" height="1em" />
						Wait for the nameserver and DNS updates to propagate.
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>This may take up to 48 hours depending on your domain registrar, but typically starts working within 30 minutes.</p>
						<p>You can use these external tools to check the propagation of the DNS:</p>
						<ul>
							<li><a href="https://ping.sx/dig">{'https://ping.sx/dig'}</a></li>
							<li><a href="https://www.whatsmydns.net/">{'https://www.whatsmydns.net/'}</a></li>
							<li><a href="https://dnschecker.org/">{'https://dnschecker.org/'}</a></li>
						</ul>
					</span>
				</span>
			</div>
			{<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" checked={backendAdded} disabled />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-hdd-network-fill pe-none me-2" width="1em" height="1em" />
						4. Setup a backend
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>Enter the backend server IP address and port in ip:port format, e.g. <code>12.34.56.78:443</code>.</p>
						<p>This is the &quot;origin&quot; that you want BasedFlare to proxy traffic to.</p>
					</span>
					<form onSubmit={addToMap} className="d-flex mb-3" action='/forms/map/hosts/add' method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<input type="hidden" name="onboarding" value="1" />
						<input className="btn btn-success" type="submit" value="+"
							//disabled={backendAdded}
						/>
						<select className="form-select mx-3" name="key" defaultValue=""
							//disabled={backendAdded}
						required>
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
								//disabled={backendAdded}
								required
							/>
						}
					</form>
					{backendAdded && (<strong>
						<i className="bi-check-circle-fill me-2" style={{ color: 'green' }}  width="1em" height="1em" />
						Backend server successfully added
					</strong>)}
				</span>
			</div>}
			<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" checked={certAdded} disabled />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-file-earmark-lock-fill pe-none me-2" width="1em" height="1em" />
						5. Generate HTTPS certificate
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>BasedFlare will generate a HTTPS certificate for you using <a href="https://letsencrypt.org/" rel="noreferrer" target="_blank">Let&apos;s Encrypt</a>.</p>
						<p>This certificate will be automatically installed on the BasedFlare edge and visitors will be connected securely.</p>
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
			<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" checked={certAdded} disabled />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-file-earmark-lock-fill pe-none me-2" width="1em" height="1em" />
						6. Get your HTTPS CSR signed
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>Finally, generate a certificate signing request for your origin server(s) and have BasedFlare sign it.</p>
						<p>This allows BasedFlare servers to verify the connection to your backend and prevents trivial MITM attacks and other weaknesses that are possible with e.g self-signed certificates in CloudFlare&apos;s &quot;flexible&quot; or &quot;full&quot; ssl mode.</p>
						<ol>
							<li>Generate the private key and certificate signing request for your domains on your origin server:
								<p>
									<code>
										{`openssl req -newkey rsa:4096 -new -nodes -subj "/CN=`}<strong>yourdomain.com</strong>{`/OU=OrganisationUnit/O=Organisation/L=Locality/ST=St/C=Co" -sha256 -extensions v3_req -reqexts SAN -keyout origin.key -out origin.csr -config <(cat /etc/ssl/openssl.cnf \<\(printf "[SAN]\\nsubjectAltName=DNS:`}<strong>www.yourdomain.com</strong>{`"))`}
									</code>
								</p>
								Make sure to replace yourdomain.com and www.yourdomain.com. It&apos;s also recommended to put the correct organisational unit, locality, state and country.
							</li>
							<li>After generating, you will have two files: <code>origin.key</code> (your private key) and <code>origin.csr</code> (the certificate signing request).</li>
							<li>Copy the contents of <code>origin.csr</code> into the box below. After submitting the form, save the output to <code>origin.crt</code></li>
							<li>You can then setup <code>origin.key</code> and <code>origin.crt</code>, as the key and certificate respectively, in your origin web server.</li>
						</ol>
					</span>
					<form className="d-flex mb-3" action="/forms/csr/verify" method="post">
						<input type="hidden" name="_csrf" value={csrf} />
						<textarea className="form-control mx-3" name="csr" placeholder="-----BEGIN CERTIFICATE REQUEST----- ..." required />
						<input className="btn btn-success" type="submit" value="Verify" />
					</form>
				</span>
			</div>
			<div className="list-group-item d-flex gap-3 justify-content-center">
				<strong>That&apos;s it!</strong>
			</div>
		</div>

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return { props: { user: res.locals.user || null, ...query } }
};
