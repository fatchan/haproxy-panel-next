import Image from 'next/image';
import Link from 'next/link';
import { withRouter } from 'next/router';

export default withRouter(function MenuLinks({ router }) {
	return (<>
		<Link href="/">
			<a className="d-flex align-items-center mb-3 mb-md-0 text-body text-decoration-none">
				<Image src="/favicon.ico" width="32" height="32" alt=" " />
				<span className="mx-2 fs-4 text-decoration-none">BasedFlare</span>
			</a>
		</Link>
		<hr />
		<ul className="nav nav-pills flex-column mb-auto">
			{/*<li className="nav-item">
				<Link href="/">
					<a className={router.pathname === "/" ? "nav-link active" : "nav-link"} aria-current="page">
						<i className="bi-house-door pe-none me-2" width="16" height="16" />
						Home
					</a>
				</Link>
			</li>*/}
			<li className="nav-item">
				<Link href="/account">
					<a className={router.pathname === "/account" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-person-square pe-none me-2" width="16" height="16" />
						Account
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/domains">
					<a className={router.pathname === "/domains" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-layers pe-none me-2" width="16" height="16" />
						Domains
					</a>
				</Link>
			</li>
			{/*<li className="nav-item">
				<Link href="/dns">
					<a className={router.pathname === "/dns" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-card-list pe-none me-2" width="16" height="16" />
						DNS
					</a>
				</Link>
			</li>*/}
			<li className="nav-item">
				<Link href="/clusters">
					<a className={router.pathname === "/clusters" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-clouds pe-none me-2" width="16" height="16" />
						Clusters
					</a>
				</Link>
			</li>
			{/*process.env.NEXT_PUBLIC_CUSTOM_BACKENDS_ENABLED && <li className="nav-item">
				<Link href="/map/backends">
					<a className={router.pathname === "/map/[name]" && router.query.name === "backends" ? "nav-link active" : "nav-link"} aria-current="page">
						<i className="bi-hdd-network pe-none me-2" width="16" height="16" />
						Internal Backends
					</a>
				</Link>
			</li>*/}
			<li className="nav-item">
				<Link href="/map/hosts">
					<a className={router.pathname === "/map/[name]" && router.query.name === "hosts" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-hdd-network pe-none me-2" width="16" height="16" />
						Backends
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/certs">
					<a className={router.pathname === "/certs" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-file-earmark-lock pe-none me-2" width="16" height="16" />
						HTTPS Certificates
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/csr">
					<a className={router.pathname === "/csr" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-building-lock pe-none me-2" width="16" height="16" />
						Origin CSR
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/map/ddos_config">
					<a className={router.pathname === "/map/[name]" && router.query.name === "ddos_config" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-sliders2 pe-none me-2" width="16" height="16" />
						Protection Settings
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/map/ddos">
					<a className={router.pathname === "/map/[name]" && router.query.name === "ddos" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-shield-check pe-none me-2" width="16" height="16" />
						Protection Rules
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/map/rewrite">
					<a className={router.pathname === "/map/[name]" && router.query.name === "rewrite" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-pencil pe-none me-2" width="16" height="16" />
						Rewrites
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/map/redirect">
					<a className={router.pathname === "/map/[name]" && router.query.name === "redirect" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-signpost pe-none me-2" width="16" height="16" />
						Redirects
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/map/whitelist">
					<a className={router.pathname === "/map/[name]" && router.query.name === "whitelist" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-person-check pe-none me-2" width="16" height="16" />
						IP Whitelist
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/map/blockedip">
					<a className={router.pathname === "/map/[name]" && router.query.name === "blockedip" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-person-slash pe-none me-2" width="16" height="16" />
						IP Blacklist
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/map/blockedasn">
					<a className={router.pathname === "/map/[name]" && router.query.name === "blockedasn" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-building-slash pe-none me-2" width="16" height="16" />
						ASN Blacklist
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/map/maintenance">
					<a className={router.pathname === "/map/[name]" && router.query.name === "maintenance" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-info-square pe-none me-2" width="16" height="16" />
						Maintenance Mode
					</a>
				</Link>
			</li>
			{/*<li className="nav-item">
				<Link href="/stats">
					<a className={router.pathname === "/stats" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-table pe-none me-2" width="16" height="16" />
						Statistics
					</a>
				</Link>
			</li>*/}
		</ul>
		<hr />
		<ul className="nav nav-pills flex-column">
			<li className="nav-item user-select-none">
				<Link href="/onboarding">
					<a className={router.pathname === "/onboarding" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-rocket-takeoff pe-none me-2" width="16" height="16" />
						Onboarding
					</a>
				</Link>
			</li>
		</ul>
		{/*<hr />
		<ul className="nav nav-pills flex-column">
			<li className="nav-item">
				<Link href="/login">
					<a className={router.pathname === "/login" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-door-closed pe-none me-2" width="16" height="16" />
						Login
					</a>
				</Link>
			</li>
			<li className="nav-item">
				<Link href="/register">
					<a className={router.pathname === "/register" ? "nav-link active" : "nav-link text-body"} aria-current="page">
						<i className="bi-person-plus pe-none me-2" width="16" height="16" />
						Register
					</a>
				</Link>
			</li>
		</ul>*/}
		<hr />
		<ul className="nav nav-pills flex-column">
			<li className="nav-item">
				<form action="/forms/logout" method="POST">
					<button className="nav-link text-body" type="submit">
						<i className="bi-door-open pe-none me-2" width="16" height="16" />
						Logout
					</button>
				</form>
			</li>
		</ul>
	</>);
})
