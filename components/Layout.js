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

						<Link href="/menu">
							<a className="btn btn-primary mobile-btn mb-4">
								Menu
							</a>
						</Link>

		{/*
						<header className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-between mb-2 me-5">
							<ul className="nav col-4 mb-2 mb-md-0">
								<li><Link href="/"><a className="nav-link px-2 link-dark">Home</a></Link></li>
							</ul>
							<div className="col-8 text-end">
								<Link href="/login"><a className="btn btn-outline-primary me-2">Login</a></Link>
								<Link href="/register"><a className="btn btn-primary">Register</a></Link>
							</div>
						</header>
		*/}
						<main>{children}</main>
						<footer className="mt-auto pt-3">
							<p className="text-center text-muted">
								<a href="https://gitgud.io/fatchan/haproxy-protection/">Open Source Bot Protection</a> + <a href="https://gitgud.io/fatchan/haproxy-panel-next/">Control Panel</a>
							</p>
						</footer>
					</div>
				</div>

			</div>
		</>
	)
}
