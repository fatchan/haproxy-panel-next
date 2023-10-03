import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function KnowledgebaseIndex() {

	return (
		<>

			<Head>
				<title>Firewall</title>
			</Head>

			<h4 className='fw-bold'>
				Whitelisting BasedFlare IPs in UFW firewall and Nginx:
			</h4>

			<hr />
			
			<p>
				This article walks you through using a bash script to whitelist BasedFlare IP addresses fetched from a DNS lookup for both UFW firewall and Nginx web server. It is recommended to implement this or a similar system to ensure that only BasedFlare IP addresses can make requests to your backend. This provides some protection against internet scanning and other techniques being used to uncover and directly attack your backend servers.
			</p>

			<hr />

			<h5 className='fw-bold'>Download</h5>
			<p>
				A shell script for automating this process is available for download <Link href='https://gitgud.io/-/snippets/1853'>here</Link>.
			</p>
			
			<hr />

			<h5 className='fw-bold'>Script Breakdown</h5>
			<p>
				Here&apos;s a breakdown of the main operations performed by the script:
			</p>
			<ul>
				<li>Queries the IP addresses of Basedflare nodes through DNS.</li>
				<li>Removes any UFW rule for IPs that are no longer in the DNS.</li>
				<li>Adds UFW rules for the fetched IPs.</li>
				<li>Generates Nginx snippets for accepting <code>X-Forwarded-For</code> headers (for visitor IP passthrough) and denying traffic from non-whitelisted IPs.</li>
			</ul>

			<hr />
		
			<h5 className='fw-bold'>Usage Steps</h5>
			<ol>
				<li>
					Add the following line in the <code>http{}</code> block of <code>/etc/nginx/nginx.conf</code>:
					<pre><code>{'include /etc/nginx/snippets/allowdeny.conf;'}</code></pre>
				</li>
				<li>
					Add the following line inside the <code>server{}</code> block of <code>/etc/nginx/sites-available/example.conf</code>:
					<pre><code>{'include /etc/nginx/snippets/realip.conf;'}</code></pre>
				</li>
				<li>
					Schedule the script to run at regular intervals, such as every hour, using cron:
					<pre><code>{'0 * * * * bash /path/to/update_realip.sh'}</code></pre>
				</li>
			</ol>
			
			<hr />
		
			<h5 className='fw-bold'>Caution</h5>
			<p>
				The provided examples might not be compatible with all environments. Depending on your specific requirements and existing configurations, you might need to adjust or tweak them. Always test configurations in a safe environment before deploying them in production.
			</p>
		
			<small>Last Updated: October 3, 2023</small>

		</>
	);

}
