import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function KnowledgebaseIndex() {

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
				<li><Link href='/kb/firewall'>Firewall</Link> - How to automatically whitelist basedflare IPs in UFW firewall and Nginx webserver to conceal your backend</li>
				<li><Link href='/kb/firewall'>HTTPS & CSRs</Link> - How to generate a CSR and get it signed by basedflare for secure backend connections</li>
				<li><Link href='/kb/debug'>/.basedflare/ URLs</Link> - Explanation of various BasedFlare resources and useful tools served under the /.basedflare/ URL path.</li>
				<li>More to come...</li>
			</ul>

		</>
	);

}
