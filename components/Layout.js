import Head from 'next/head';
import Link from 'next/link';
import MenuLinks from './MenuLinks';
import { withRouter } from 'next/router';

export default withRouter(function Layout({ children, router }) {
	const showMenu = !['/login', '/register', '/changepassword', '/'].includes(router.pathname);
	return (
		<>

			<Head>
				<meta charSet="utf-8"/>
				<meta name="viewport" content="width=device-width initial-scale=1"/>
				<link rel="shortcut icon" href="/favicon.ico" />
			</Head>

			<div className="row h-100 p-0 m-0">

				{showMenu && <div className="col-auto sidebar h-100 m-0 px-0">
					<div className="d-flex flex-column flex-shrink-0 p-3 h-100 overflow-auto" style={{ width: '280px' }}>
						<MenuLinks />
					</div>
				</div>}

				<div className="col-1 flex-fill m-0 px-0 h-100 overflow-auto">
					<div className="p-3 h-100 d-flex flex-column">

						<main>
							{showMenu && <Link href="/menu">
								<a className="btn btn-primary mobile-btn mb-4 d-inline-block">
									<i className="bi-list pe-none me-2" width="16" height="16" />
									Menu
								</a>
							</Link>}
							{children}
						</main>

						<footer className="mt-auto text-center text-muted small">
							<hr />
							<span className="d-block fs-xs">(Under Construction... 🏗️)</span>
							<a className="pb-4 fs-xs" href="https://gitgud.io/fatchan/haproxy-panel-next/">haproxy-panel-next</a>
						</footer>

					</div>
				</div>

			</div>
		</>
	)
})
