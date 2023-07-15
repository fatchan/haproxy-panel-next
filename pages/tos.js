import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

export default function Tos() {

	return (
		<>

			<Head>
				<title>Terms of Service</title>
			</Head>

			<h5 className="fw-bold">
				Terms of Service:
			</h5>

			<ol>
				<li>We make no guarantees of any kind.</li>
				<li>We are not liable for anything.</li>
				<li>This service is to be only used for legal purposes.</li>
				<li>These terms of service may change at any time with or without notice and will still fully apply.</li>
				<li>We comply with all US government agencies.</li>
				<li>By using this service you agree to all of these terms of service.</li>
			</ol>

			<p>Contact: abuse@ceoofbased.com / +1 (307) 461-4336</p>

		</>
	);

}
