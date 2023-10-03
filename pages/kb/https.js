import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function KnowledgebaseIndex() {

	return (
		<>

			<Head>
				<title>HTTPS & CSRs</title>
			</Head>

			<h4 className='fw-bold'>
				Generating a Private Key and CSR for HTTPS:
			</h4>

			<hr />

			<p>
				When setting up HTTPS for your website, especially when using services like BasedFlare, it&apos;s essential to generate a certificate signing request (CSR) and private key, and have that CSR signed. This article will guide you through how to do so using OpenSSL.
			</p>

			<hr />

			<h5 className='fw-bold'>OpenSSL Command Breakdown</h5>
			<pre>
				{'openssl req -newkey rsa:4096 -new -nodes -subj "/CN=yourdomain.com/OU=OrganisationUnit/O=Organisation/L=Locality/ST=St/C=Co" -sha256 -extensions v3_req -reqexts SAN -keyout origin.key -out origin.csr -config <(cat /etc/ssl/openssl.cnf <(printf "[SAN]\nsubjectAltName=DNS:yourdomain.com,DNS:www.yourdomain.com"))'}
			</pre>
			<ol>
				<li><code>req</code>: Initiates a request for creating a new certificate signing request (CSR) and private key.</li>
				<li><code>-newkey rsa:4096</code>: Generates a new private key using the RSA algorithm with a key length of 4096 bits.</li>
				<li><code>-new -nodes</code>: Requests a new certificate signing request and avoids encrypting the private key.</li>
				<li><code>{'-subj "/CN=http://yourdomain.com/OU=OrganisationUnit/O=Organisation/L=Locality/ST=St/C=Co/OU=OrganisationUnit/O=Organisation/L=Locality/ST=St/C=Co)"'}</code>: Specifies the subject fields for the CSR. Replace <code>yourdomain.com</code> with your desired domain.</li>
				<li><code>-sha256</code>: Uses the SHA-256 hashing algorithm for the CSR.</li>
				<li><code>-extensions v3_req -reqexts SAN</code>: Specifies that this certificate request should contain the v3 extensions and the Subject Alternative Name (SAN) fields.</li>
				<li><code>-keyout origin.key</code>: Outputs the private key to a file named <code>origin.key</code>.</li>
				<li><code>-out origin.csr</code>: Outputs the CSR to a file named <code>origin.csr</code>.</li>
				<li><code>-config</code>: Specifies the configuration file to use, combining the default OpenSSL configuration (<code>/etc/ssl/openssl.cnf</code>) with the additional SAN configuration.</li>
			</ol>

			<hr />

			<h5 className='fw-bold'>Modifying for a Different Domain</h5>
			<p>
				To replace <code>yourdomain.com</code> with your domain, you&apos;ll need to make two changes:
			</p>
			<ol>
				<li>In the <code>-subj</code> option, change the <code>CN=yourdomain.com</code> value.</li>
				<li>In the <code>[SAN]</code> configuration section, replace both instances of <code>yourdomain.com</code> with your desired domain. Additional names can be added in a comma delimited format, each starting with <code>DNS:</code>. The command provides two altnames as an example.</li>
			</ol>

			<hr />

			<h5 className='fw-bold'>Verification</h5>
			<p>
				With the contents of the origin.csr created earlier, complete the <Link href='/csr'>CSR verification form</Link> in the BasedFlare panel. This will sign the request and return your certificate, provided you have permission for the domains i.e. they are your domains in your account. The generated CSR will be verified by BasedFlare and will be used to ensure that each reverse proxy connects only to an origin with a certificate signed by the BasedFlare CA. This process ensures secure backend connections. It&apos;s important to note that self-signed or invalid certificates won&apos;t work.
			</p>

			<hr />

			<h5 className='fw-bold'>Integrating with Nginx</h5>
			<p>
				After you have received your signed SSL certificate and saved it (typically with a <code>.crt</code> extension), you can incorporate it and the private key into an Nginx configuration, for example:
			</p>
			<pre>
				{`server {

listen 443 ssl;

server_name yourdomain.com www.yourdomain.com;

ssl_certificate /path/to/your/signed_certificate.crt;
ssl_certificate_key /path/to/your/origin.key;

...
}`}
			</pre>
			<p>
				Replace the domains after server_name, <code>/path/to/your/signed_certificate.crt</code> with the path to your signed certificate and <code>/path/to/your/origin.key</code> with the path to the private key you generated earlier.
			</p>

			<hr />

			<h5 className='fw-bold'>Caution</h5>
			
			<p>
				While the provided configurations and commands are standard, they might not be compatible with all environments. Depending on your specific requirements and existing configurations, you might need to adjust or tweak them. Always test configurations in a safe environment before deploying them in production.
			</p>
		
			<small>Last Updated: October 3, 2023</small>

		</>
	);

}
