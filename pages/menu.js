import Head from 'next/head';
import MenuLinks from '../components/MenuLinks';

export default function Menu() {
	return (<>
		<Head>
			<title>Menu</title>
		</Head>

		<div className='p-3 pt-0 mobile-menu'>
			<MenuLinks />
		</div>
	</>);
}
