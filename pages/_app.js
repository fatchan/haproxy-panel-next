import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Layout from '../components/Layout.js';
import 'nprogress/nprogress.css';

export default function App({ Component, pageProps }) {
	return (
		<Layout>
			<style>
			{`
				html, body { font-family: helvetica,arial,sans-serif; height: 100%; }
				.green { color: green; }
				.red { color: red; }
				footer { margin-top: auto; }
				.btn { font-weight: bold; }
				.nav-item:not(:first-child) { margin-top: 10px; }
				.nav-link { color: white; }
				.nav-link:hover { color: #6aa6fd; }
				.mobile-menu { margin: 0 -24px; }
				@media (min-width: 800px) {
					.mobile-btn { display: none!important; }
				}
				@media (max-width: 800px) {
					.sidebar { display: none; }
				}
				@media (prefers-color-scheme: dark) {
					:root { --bs-body-color: #fff; --bs-body-bg: #161616; }
					.text-muted, a, a:visited, a:hover, .nav-link, .nav-link:hover { color:#fff!important; }
					.list-group-item { color: #fff; background-color: #111111; }
					input:not(.btn), option, select.form-select { color: #fff!important; background-color: #111111!important; border: 1px solid black!important; }
					.list-group-item-action:focus, .list-group-item-action:hover { color: #fff; background-color: #1F1F1F; }
					.table { color: #fff; border-color: transparent !important; }
				}
			`}
			</style>
			<Component {...pageProps} />
		</Layout>
	);
}
