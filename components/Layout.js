import Head from 'next/head';
import Link from 'next/link';
import MenuLinks from './MenuLinks';
import { withRouter } from 'next/router';

export default withRouter(function Layout({ children, router }) {
	const showMenu = !['/tos', '/login', '/register', '/changepassword', '/'].includes(router.pathname);
	return (
		<>

			<Head>
				<meta charSet="utf-8"/>
				<meta name="viewport" content="width=device-width initial-scale=1"/>
				<link rel="shortcut icon" href="/favicon.ico" />
			</Head>

			<div className="row h-100 p-0 m-0">

				{showMenu && <div className="col-auto sidebar h-100 m-0 px-0">
					<div className="d-flex flex-column flex-shrink-0 p-3 h-100 overflow-auto" style={{ width: '250px' }}>
						<MenuLinks />
					</div>
				</div>}

				<div className="col-1 flex-fill m-0 px-0 h-100 overflow-auto">
					<div className="p-3 h-100 d-flex flex-column">
						<span className="corner-ribbon">Beta</span>
						<main className="mx-auto col col-12 col-xl-8">
							{showMenu && <Link href="/menu">
								<a className="btn btn-sm btn-primary mobile-btn mb-4 d-inline-block">
									<i className="bi-list pe-none me-2" width="16" height="16" />
									Menu
								</a>
							</Link>}
							{children}
						</main>

						<footer className="mt-auto text-center text-muted small">
							<hr />
							<a className="pb-3 fs-xs" href="https://gitgud.io/fatchan/haproxy-panel-next/">source code</a>
							{" "}&bull;{" "}
							<a className="pb-3 fs-xs" target="_blank" rel="noreferrer" href="https://basedstatus.online">status page</a>
						</footer>

					</div>
				</div>

			</div>
		</>
	)
})
