import 'bootstrap/dist/css/bootstrap.css';
import NProgress from 'nprogress';
import Layout from '../components/Layout.js';
import "nprogress/nprogress.css";

export default function App({ Component, pageProps }) {
	return (
		<Layout>
			<style>
			{`
				html, body { font-family: arial,helvetica,sans-serif; height: 100%; }
				.green { color: green; }
				.red { color: red; }
				footer { margin-top: auto; }
				.btn { font-weight: bold; }
				@media (prefers-color-scheme: dark) {
					:root { --bs-body-color: #fff; --bs-body-bg: #000000; }
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
