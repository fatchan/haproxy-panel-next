import Head from 'next/head';

export default function PortsKnowledgebase() {

	return (
		<>
			<Head>
				<title>Network Ports</title>
			</Head>

			<h4 className='fw-bold'>
				Network Ports:
			</h4>

			<hr />

			<p>
				By default, requests to <code>domain.com:443</code> will be sent to the IP and port specified in the &quot;Backends&quot; map. However, several additional ports are supported for proxying to backends.
			</p>

			<h5 className='fw-bold'>Standard Ports</h5>
			<p>The following standard ports are supported:</p>
			<ul>
				<li>80 (permanently redirected to 443)</li>
				<li>443</li>
			</ul>

			<h5 className='fw-bold'>Additional Supported Ports</h5>
			<p>The following additional ports are also supported for proxying:</p>
			<ul>
				<li>2053</li>
				<li>2083</li>
				<li>2087</li>
				<li>2096</li>
				<li>8443</li>
				<li>8888</li>
			</ul>

			<p>
				For example, if you configure your backend as <code>domain.com &rarr; 12.34.56.78:3000</code>, normal requests incoming to <strong>domain.com:443</strong> will be proxied to port <strong>12.34.56.78:3000</strong> on your backend. Requests incoming to an additional port such as <strong>domain.com:2053</strong> will be proxied to port <strong>12.34.56.78:2053</strong>.
			</p>

			<p>
				Load balancing and regional rules apply as normal. Please note that mapping these additional ports to a different backend port is not supported or planned.
			</p>

			<hr />

			<small>Last Updated: June 16, 2025</small>

		</>
	);
}
