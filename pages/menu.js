import Head from 'next/head';
import MenuLinks from '../components/MenuLinks';

const Menu = () => (
	<>
		<Head>
			<title>Menu</title>
		</Head>

		<div className="bg-dark p-4">
			<MenuLinks />
		</div>
	</>
);

export default Menu;
