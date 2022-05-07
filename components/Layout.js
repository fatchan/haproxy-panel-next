import Head from 'next/head';
import Link from 'next/link';

export default function Layout({ children }) {
	return (
		<>
			<Head>
				<meta charSet="utf-8"/>
				<meta name="viewport" content="width=device-width initial-scale=1"/>
			</Head>
			<div className="container col-lg-6">
				<header className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-between py-3 mb-4 border-bottom border-dark">
					<ul className="nav col-4 mb-2 mb-md-0">
						<li><Link href="/"><a className="nav-link px-2 link-dark">Home</a></Link></li>
					</ul>
					<div className="col-8 text-end">
						<Link href="/login"><a className="btn btn-outline-primary me-2">Login</a></Link>
						<Link href="/register"><a className="btn btn-primary">Register</a></Link>
					</div>
				</header>
				<main>{children}</main>
			</div>
			<footer className="py-3 mt-auto">
				<p className="text-center text-muted">
					<a href="https://gitgud.io/fatchan/haproxy-protection/">Open Source Bot Protection</a> + <a href="https://gitgud.io/fatchan/haproxy-panel/">Control Panel</a>
				</p>
			</footer>
		</>
	)
}
