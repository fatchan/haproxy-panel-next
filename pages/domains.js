import Head from 'next/head';
import Link from 'next/link';
import BackButton from '../components/BackButton.js'

const Domains = () => (
	<>
		<Head>
			<title>Domains</title>
		</Head>

		<p>TODO: domains</p>

		{/* back to account */}
		<BackButton to="/account" />

	</>
);

export default Domains;
