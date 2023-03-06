import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Layout from '../components/Layout.js';
import 'nprogress/nprogress.css';
import NProgress from "nprogress";
import Router from "next/router";


const loadRoutes = ['/login', '/register', '/changepassword', '/']
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", (url) => loadRoutes.includes(url) && NProgress.start());
Router.events.on("routeChangeComplete", (url) => loadRoutes.includes(url) && NProgress.done());
Router.events.on("routeChangeError", (url) => NProgress.done());

export default function App({ Component, pageProps }) {
	return (
		<Layout>
			<style>
			{`
				html, body { font-family: helvetica,arial,sans-serif; height: 100%; overflow: hidden; }
				.corner-ribbon {width: 180px;top: 8px;left: auto;text-align: center;line-height: 30px;letter-spacing: 1px;color: white;background: darkorange;box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);right: -70px;transform: rotate(45deg);-webkit-transform: rotate(46deg);position: absolute;overflow: hidden;}
				.green { color: green; }
				.red { color: red; }
				footer { margin-top: auto; }
				.btn { font-weight: bold; }
				.nav-item:not(:first-child) { margin-top: 10px; }
				.nav-link { color: white; }
				.nav-link:hover { color: #6aa6fd; }
				.mobile-menu { margin: 0 -16px; }
				.fs-xs { font-size: small; }
				.table, .list-group { box-shadow: 0 0px 3px rgba(0,0,0,.1); max-width: max-content; min-width: 600px; }
				.text-decoration-none { color: var(--bs-body-color); }
				@media (max-width: 650px) {
					.table, .list-group { min-width: unset; }
				}
				@media (min-width: 800px) {
					.mobile-btn { display: none!important; }
				}
				@media (max-width: 800px) {
					.sidebar { display: none; }
				}
				@media (prefers-color-scheme: dark) {
					:root { --bs-body-color: #fff; --bs-body-bg: #161616; }
					.text-muted, a, a:visited, a:hover, .nav-link, .nav-link:hover { color:#fff!important; }
					.list-group-item { color: #fff; background-color: unset; }
					input:not(.btn), option, select.form-select, textarea { color: #fff!important; background-color: #393939!important; border: 1px solid black!important; }
					.list-group-item-action:focus, .list-group-item-action:hover { color: #fff; background-color: #1F1F1F; }
					.table { color: #fff; border-color: var(--bs-gray-900)!important; }
				}
			`}
			</style>
			<Component {...pageProps} />
		</Layout>
	);
}
