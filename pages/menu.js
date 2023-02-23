import Head from 'next/head';
import MenuLinks from '../components/MenuLinks';

export default function Menu() {
	return (<>
		<Head>
			<title>Menu</title>
		</Head>

		<div className="bg-dark p-4">
			<MenuLinks />
		</div>
	</>);
};
