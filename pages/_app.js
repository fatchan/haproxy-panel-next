import 'bootstrap/dist/css/bootstrap.css';
import Layout from '../components/Layout.js';

export default function App({ Component, pageProps }) {
	return (<Layout>
		<style>
		{`
			html, body { font-family: arial,helvetica,sans-serif; height: 100%; }
			.green { color: green; }
			.red { color: red; }
			footer { margin-top: auto; }
			.btn { font-weight: bold; }
			@media (prefers-color-scheme: dark) {
				:root { --bs-body-color: #fff; --bs-body-bg: #33393B; }
				.text-muted, a, a:visited, a:hover, .nav-link, .nav-link:hover { color:#fff!important; }
				.list-group-item { color: #fff; background-color: #33393B; }
				input:not(.btn), option, select { color: #fff!important; background-color: #33393B!important; }
				.list-group-item-action:focus, .list-group-item-action:hover { color: #fff; background-color: #4f5355; }
				.table { color: #fff; border-color: transparent !important; }
			}
		`}
		</style>
		<Component {...pageProps} />
	</Layout>);
}
