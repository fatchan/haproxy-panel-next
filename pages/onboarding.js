import Head from 'next/head';
import Link from 'next/link';

export default function Onboarding() {
	return (<>

		<Head>
			<title>Onboarding</title>
		</Head>

		<h5 className="fw-bold">Onboarding</h5>
		<h6>(Under Construction... 🏗️)</h6>

		<div className="list-group">
			<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-card-list pe-none me-2" width="1em" height="1em" />
						1. Add your website domain(s)
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>Add your domains in the &quot;domains&quot; section, including subdomains. These are the domains that you want to protect with BasedFlare.</p>
						<p>For most websites, this would be the root domain i.e. <code>example.com</code>, and the www subdomain i.e. <code>www.example.com</code>.</p>
					</span>
					<small>(form goes here)</small>
				</span>
			</div>
			<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-globe2 pe-none me-2" width="1em" height="1em" />
						2. Update DNS records
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>For each of your domains and subdomains, set the following A and AAAA records with your DNS provider:</p>
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
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-hdd-network-fill pe-none me-2" width="1em" height="1em" />
						3. Enter backend details
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>For each domain and subdomain, set the backend server IP address and port in the &quot;backends&quot; section.</p>
						<p>The backend address and port should be in ip:port format, e.g. <code>12.34.56.78:443</code>.</p>
					</span>
					<small>(form goes here)</small>
				</span>
			</div>
			<div className="list-group-item d-flex gap-3">
				<input className="form-check-input flex-shrink-0" type="checkbox" value="" />
				<span className="pt-1 form-checked-content">
					<strong>
						<i className="bi-file-earmark-lock-fill pe-none me-2" width="1em" height="1em" />
						3. Generate a HTTPS certificate <small>(optional, recommended)</small>
					</strong>
					<span className="d-block text-body-secondary mt-3">
						<p>BasedFlare can generate and setup a HTTPS certificates for you using <a href="https://letsencrypt.org/" rel="noreferrer" target="_blank">Let’s Encrypt</a>.</p>
						<p>Enter the domain subject and altnames in the &quot;HTTPS Certificates&quot; section and hit generate.</p>
						<p>Additionally, if you operate a self-managed cluster and add new servers, you can upload any generated certificates to the new servers seamlessly.</p>
					</span>
					<small>(form goes here)</small>
				</span>
			</div>
			<div className="list-group-item d-flex gap-3">
				All done!
			</div>
		</div>

	</>);
}
