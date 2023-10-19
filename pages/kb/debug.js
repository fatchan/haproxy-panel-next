import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function BasedflareDebugRoutes() {

	return (
		<>

			<Head>
				<title>BasedFlare Debugging Routes</title>
			</Head>

			<h4 className='fw-bold'>
				Debugging & BasedFlare Routes:
			</h4>

			<hr />

			<p>
				For use by BasedFlare internally, for debugging, and for some utilities/tools, there are several resources provided under the &quot;/.basedflare&quot; URL path.
			</p>

			<hr />

			<h5 className='fw-bold'>Available Routes:</h5>
			<ul>
				<li><code>/.basedflare/cgi/trace</code>: A debugging route that displays information such as your IP, useragent, geoip country code, the name and id of the node you reached, challenge cookie expiry, and more. You can quote the <code>node_hn</code> and <code>node_id</code> when you contact support if you are having trouble with a specific node.</li>
				<li><code>/.basedflare/js/auto.min.js</code>: A script that can be included in your page to automatically solve the bot check in the background to prevent interruption during long sessions.</li>
				<li><code>/.basedflare/pow-icon</code>: A URL used for a small image shown on BasedFlare pages including the bot-check and maintenance pages. If you want to customise the image displayed, add an entry in the rewrites map from &quot;yourdomain.com/.basedflare/pow-icon&quot; to the domain+path of an image of your choice.</li>
				<li><code>/.basedflare/bot-check</code>: The bot check page. Whenever bot checking is enabled, visitors will be redirected to this path with the original URL in the query string. Once they complete the challenge, they will be redirected back to the original URL.</li>
				<li><code>/.basedflare/js/challenge.min.js</code>: The main script used on the bot check protection page.</li>
				<li><code>/.basedflare/js/worker.min.js</code>: Worker script used for multithreading the bot check.</li>
				<li><code>/.basedflare/js/argon2.min.js</code>: Argon2 implementation in WebAssembly used when the bot check is set to argon2 mode.</li>
			</ul>
			<hr />

			<h5 className='fw-bold'>How to Access:</h5>
			<p>
				To access these routes, navigate to your domain and append the desired route after the base URL. For instance, if you wish to access &quot;/.basedflare/cgi/trace&quot;, you&apos;d go to &quot;yourdomain.com/basedflare/cgi/trace&quot;.
			</p>

			<hr />

			<h5 className='fw-bold'>Trace (<code>/.basedflare/cgi/trace</code>)</h5>
			<p>
				Here&apos;s an example trace page with a few comments explaining each value:
				<pre>
					<code>
						{`
ts=1697368994.730                        # Timestamp
h=basedflare.com                         # Host header
ip=12.34.56.78                           # Your IP address
cc=AU                                    # Geoip country code
uag=Mozilla/5.0 (Windows NT 10.0;...     # Useragent
http=HTTP/2.0                            # HTTP version
tls=1                                    # TLS statusm 1=on 0=off
tlsv=TLSv1.3                             # The TLS version
tlscip=TLS_CHACHA20_POLY1305_SHA256      # The TLS cipher used
tlssni=basedflare.com                    # The SNI (server name identification) used
node_hn=fe-us-4.bfcdn.host               # Hostname of the proxy node
node_id=d3b0f8b175a7d93ef84068dc28609334 # ID of the proxy node
expiry=21600                             # Expiry of the challenge cookie in seconds
`}
					</code>
				</pre>
			</p>

			<hr />

			<h5 className='fw-bold'>Auto.js (<code>/.basedflare/js/auto.min.js</code>)</h5>
			<p>
				This script will automatically solve the bot check in the background before the cookie expires to prevent interruption during long sessions.
			</p>
			<p>
				You should add it inside the top of the <code>&lt;head&gt;</code> tag on all your HTML pages like <code>{'<script language="javascript" src="/.basedflare/js/auto.min.js"></script>'}</code>.
			</p>
			<p>
				Alternatively, if you use nginx with the <code>sub_filter</code> module installed, you can add a snippet like:
				<pre>
					<code>
						{`
sub_filter </head> '<script language="javascript" src="/.basedflare/js/auto.min.js"></script></head>';
sub_filter_once on;
`}
					</code>
				</pre>
				By default, nginx sub_filter acts only on content-type text/html, so this should add it to all your pages.
			</p>

			<hr />

			<h5 className='fw-bold'>Caution:</h5>
			<p>
				Please ensure you&apos;re aware of the functionalities and implications of each route before using them. Incorrect usage might lead to undesired behaviors or potential security risks. The provided examples might not be compatible with all environments. Depending on your specific requirements and existing configurations, you might need to adjust or tweak them. Always test configurations in a safe environment before deploying them in production.
			</p>

			<small>Last Updated: October 15, 2023</small>

		</>
	);

}
