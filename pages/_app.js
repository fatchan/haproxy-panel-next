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
				html, body { font-family: arial,Helvetica,sans-serif; height: 100%; overflow: hidden; }
				.corner-ribbon {z-index:9999; width: 180px;top: 8px;left: auto;text-align: center;line-height: 30px;letter-spacing: 1px;color: white;background: darkorange;box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);right: -70px;transform: rotate(45deg);-webkit-transform: rotate(46deg);position: fixed;overflow: hidden;}
				.green { color: green; }
				.red { color: red; }
				footer { margin-top: auto; }
				.btn { font-weight: bold; }
				.nav-item:not(:first-child) { margin-top: 10px; }
				.nav-link { color: white; }
				.nav-link:hover { color: #6aa6fd; }
				.mobile-menu { margin: 0 -16px; }
				.fs-xs { font-size: small; }
				.table, .list-group { box-shadow: 0 0px 3px rgba(0,0,0,.1); max-width: 100%; min-width: 600px; background-color: var(--bs-body-bg); }
				.text-decoration-none { color: var(--bs-body-color); }
				.sidebar { box-shadow: 0 0px 3px rgba(0,0,0,0.2); }
				.card { background: var(--bs-body-bg) !important; color: var(--bs-body-color) !important; }
				.select__control {
					transition: none;
				}
				.select__control:hover:not(.select__control--is-focused) {
					border-color: #ced4da;
				}
				.select__control--menu-is-open, .select__control--is-focused {
					box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
					border-color: #86b7fe!important;
				}
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
					:root { --bs-body-color: #fff; --bs-body-bg: #222; }
					.text-muted, a, a:visited, a:hover, .nav-link, .nav-link:hover { color:#fff!important; }
					.list-group-item { color: #fff; background-color: unset; }
					input:not(.btn):not(.select__input), option, select.form-select, textarea { color: #fff!important; background-color: #393939!important; border: 1px solid black!important; }
					.list-group-item-action:focus, .list-group-item-action:hover { color: #fff; background-color: #1F1F1F; }
					.table { color: #fff; border-color: var(--bs-gray-900)!important; }
					.select__control {
					    background-color: #393939;
					    border-color: var(--bs-gray-900);
					    transition: none;
					}
					.select__input {
					    color: white!important;
					}
					.select__control:hover:not(.select__control--is-focused) {
					    border-color: black;
					}
					.select__control--is-focused,
					.select__control--menu-is-open {
					    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
					    border-color: black!important;
					}
					.select__multi-value {
					    background-color: var(--bs-dark);
					    border-radius: 5px;
					}
					.select__multi-value__label {
					    padding: 2px 10px;
					    color: #fff;
					}
					.select__menu {
					    background-color: #393939;
					    border: 1px solid var(--bs-gray-900);
					}
					.select__option {
					    background-color: #393939;

					}
					.select__option:hover {
					    background-color: var(--bs-dark);
					}
					.select__indicator-separator {
					    background-color: #393939;
					}
					.select__clear-indicator:hover {
					    color: #fff;
					}
					.select__multi-value__remove:hover {
					    background-color: #5D2F24;
					    color: #DE350B;
					    border-radius: 0 5px 5px 0;
					}
					.select__placeholder,
					.select__single-value {
					    color: #fff;
					}
				}
			`}
			</style>
			<Component {...pageProps} />
		</Layout>
	);
}
