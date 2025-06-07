import Head from 'next/head';
import Link from 'next/link';

export default function KnowledgebaseIndex () {

	return (
		<>

			<Head>
				<title>Knowledgebase</title>
			</Head>

			<h4 className='fw-bold'>
				Knowledgebase:
			</h4>

			<hr />

			<h4 className='fw-bold'>Current articles:</h4>
			<ul>
				<li><Link href='/kb/protection'>Protection Settings</Link> - Details about bot-check modes and settings</li>
				<li><Link href='/kb/firewall'>Firewall</Link> - How to automatically whitelist edge server IPs in UFW firewall and Nginx webserver to conceal your backend</li>
				<li><Link href='/kb/https'>HTTPS & CSRs</Link> - How to generate a CSR and get it signed for secure backend connections</li>
				<li><Link href='/kb/debug'>/{process.env.NEXT_PUBLIC_DOT_PATH}/ URLs</Link> - Explanation of resources and useful tools served under the /{process.env.NEXT_PUBLIC_DOT_PATH}/ URL path.</li>
				<li><Link href='/kb/streaming'>Live Streaming</Link> - Details about managed video livestreaming</li>
				<li><Link href='/kb/ports'>Network Ports</Link> - Which ports are available, and how port mappings work for backends</li>
			</ul>

		</>
	);

}
