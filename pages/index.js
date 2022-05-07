import Head from 'next/head';
import Link from 'next/link';

const Index = () => (
	<>
		<Head>
			<title>Homepage</title>
		</Head>

		<Link href="/account">Account Page</Link>
	</>
);

export default Index;
