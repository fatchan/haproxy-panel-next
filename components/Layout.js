import Head from 'next/head';
import Link from 'next/link';
import MenuLinks from './MenuLinks';

export default function Layout({ children }) {
	return (
		<>

			<Head>
				<meta charSet="utf-8"/>
				<meta name="viewport" content="width=device-width initial-scale=1"/>
				<link rel="shortcut icon" href="/favicon.ico" />
			</Head>

			<div className="row h-100 p-0 m-0">

				<div className="col-auto sidebar h-100 m-0 px-0">
					<div className="d-flex flex-column flex-shrink-0 p-3 text-bg-dark h-100 overflow-auto" style={{ width: '280px' }}>
						<MenuLinks />
					</div>
				</div>

				<div className="col-1 flex-fill m-0 px-0 h-100 overflow-auto">
					<div className="p-4 h-100 d-flex flex-column">

						<main>
							<Link href="/menu">
								<a className="btn btn-primary mobile-btn mb-4 d-inline-block">
									<i className="bi-list pe-none me-2" width="16" height="16" />
									Menu
								</a>
							</Link>
							{children}
						</main>

						<footer className="mt-auto text-center text-muted small">
							<hr />
							<a className="pb-4" href="https://gitgud.io/fatchan/haproxy-panel-next/">haproxy-panel-next</a>
						</footer>

					</div>
				</div>

			</div>
		</>
	)
}
