import Head from 'next/head';

export default function ProtectionKnowledgebase() {

	return (
		<>
			<Head>
				<title>Protection Settings</title>
			</Head>

			<h4 className='fw-bold'>
				Protection Settings Overview:
			</h4>

			<hr />

			<p>
				This article provides an overview of the protection settings available in the system. There are two main items under &quot;Protection&quot; in the sidebar: <strong>Protection Rules</strong> and <strong>Protection Settings</strong>. These settings allow you to configure which domains or specific paths have protection enabled, the level of challenge for requests, and specific challenge parameters per domain.
			</p>

			<hr />

			<h5 className='fw-bold'>Protection Rules</h5>
			<p>
				Users can enter any domain or domain+path to specify protection. This is particularly useful for protecting specific pages such as registration or login, or for applying more stringent challenges like CAPTCHA only on those pages. The available modes for protection are:
			</p>
			<ul>
				<li><strong>None</strong> - No challenge. This is the same as not having a rule defined, but can also be used to e.g. challenge a whole domain with a domain rule, and remove the challenge on specific paths, if desired.</li>
				<li><strong>PoW (Suspicious Only)</strong> - Proof of Work challenge for suspicious requests.</li>
				<li><strong>Captcha (Suspicious Only)</strong> - CAPTCHA challenge for suspicious requests.</li>
				<li><strong>PoW (All)</strong> - Proof of Work Challenge for all requests.</li>
				<li><strong>PoW (All) + Captcha (Suspicious Only)</strong> - Combined Proof of Work and CAPTCHA for suspicious requests.</li>
				<li><strong>Captcha (All)</strong> - CAPTCHA Challenge for all requests.</li>
			</ul>

			<p>
				There are four suspicion levels that apply only to &quot;Suspicious Only&quot; modes:
			</p>
			<ul>
				<li><strong>1 (Tor Exits)</strong> - Known Tor exit nodes.</li>
				<li><strong>2 (+Fingerprints)</strong> - Known fingerprints of malware, malicious browsers, automated tools, programming language http request libraries, etc.</li>
				<li><strong>3 (+VPNs)</strong> - Known proxy networks or VPN providers.</li>
				<li><strong>4 (+Datacenters)</strong> - Datacenter networks not typically used by consumer internet connections.</li>
			</ul>

			<hr />

			<h5 className='fw-bold'>Protection Settings</h5>
			<p>
				Protection Settings allow users to specify challenge parameters per domain. The options include:
			</p>
			<ul>
				<li><strong>Difficulty</strong> - Determines how difficult the challenge is, with a minimum of 8. A Difficulty of ~18 is easy, ~22 is average and recommended, and 24+ is longer. Even very low difficulties will filter out the majority of attacks from simple attacks that do not execute javascript. Higher difficulties filter out more sophisticated bots that can execute JavaScript or leverage headless browsers, making it more expensive for attackers.</li>
				<li><strong>PoW Type</strong> - The Algorithm Used for Proof of Work, either SHA256 or Argon2. Argon2 is more resistant to parallelization and acceleration by special hardware or GPUs. Note that Argon2 requires WebAssembly, which is supported by over 99% of tracked browsers (<a href='https://caniuse.com/wasm' target='_blank' rel='noreferrer'>see caniuse.com/wasm</a>).</li>
				<li><strong>Expiry</strong> - Specifies how long the challenge lasts before a new bot-check is required. After the initial bot-check, you may insert the &quot;auto&quot; script provided, which will automatically re-solve the challenge transparently to the user before it expires to prevent session interruption. Note that this does not support CAPTCHA. More details are available <a href='/kb/debug' target='_blank' rel='noreferrer'>here</a>.</li>
				<li><strong>Per-IP Cookie</strong> - Determines if the solved challenge is valid for a single IP. A new challenge is required if the IP changes, such as when using a VPN or moving between mobile network towers.</li>
				<li><strong>Show NoJS</strong> - Indicates whether a <code>&lt;noscript&gt;</code> tag with special instructions is displayed for users without JavaScript. This allows access without enabling JavaScript, but does not work for CAPTCHA modes, which will still prompt users to enable JavaScript.</li>
			</ul>

			<hr />

			<small>Last Updated: June 8, 2025</small>

		</>
	);
}

