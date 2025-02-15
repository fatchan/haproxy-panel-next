import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Layout from '../components/Layout.js';
import 'nprogress/nprogress.css';
import NProgress from 'nprogress';
import Router from 'next/router';
import '@fontsource/inter';
import './global.css';
import { Toaster } from 'react-hot-toast';

const loadRoutes = ['/login', '/register', '/changepassword', '/requestchangepassword', '/'];
NProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', (url) => loadRoutes.includes(url) && NProgress.start());
Router.events.on('routeChangeComplete', (url) => loadRoutes.includes(url) && NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

export default function App({ Component, pageProps }) {
	return (
		<Layout {...pageProps}>
			<Toaster
				toastOptions={{
					style: {
						background: 'var(--bs-body-bg)',
						color: 'var(--bs-body-color)'
					}
				}}
			/>
			<Component {...pageProps} />
		</Layout>
	);
}
