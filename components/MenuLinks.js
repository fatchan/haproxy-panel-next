import Image from 'next/image';
// TODO: Remove once https://github.com/vercel/next.js/issues/52216 is resolved.
// next/image` seems to be affected by a default + named export bundling bug.
let ResolvedImage = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import Link from 'next/link';
import { withRouter } from 'next/router';
import { useState } from 'react';
import Router from 'next/router';

export default withRouter(function MenuLinks({ router }) {

	const [path, setPath] = useState(router.pathname);
	Router.events.on('routeChangeStart', setPath);
	const kbMenu = router.pathname.startsWith('/kb');
	let mainLinks, bottomLinks;

	switch(true) {
		case router.pathname.startsWith('/kb'):
			mainLinks = (<>
				<ul className='nav nav-pills flex-column mb-auto'>
					<li className='nav-item'>
						<Link href='/kb' className={path === '/kb' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-layers pe-none me-2' width='16' height='16' />
								Index
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/kb/firewall' className={path === '/kb/firewall' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-bricks pe-none me-2' width='16' height='16' />
								Firewall
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/kb/https' className={path === '/kb/https' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-file-earmark-lock pe-none me-2' width='16' height='16' />
								HTTPS & CSRs
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/kb/debug' className={path === '/kb/debug' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-code-slash pe-none me-2' width='16' height='16' />
								/.basedflare/ URLs
						</Link>
					</li>
				</ul>
			</>);
			bottomLinks = null;
			break;
		default:
			mainLinks = (<>
				<ul className='nav nav-pills flex-column'>
					<li className='nav-item'>
						<Link href='/account' className={path === '/account' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-person-square pe-none me-2' width='16' height='16' />
								Account
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/domains' className={path === '/domains' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-layers pe-none me-2' width='16' height='16' />
								Domains
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/hosts' className={path === '/map/hosts' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-hdd-network pe-none me-2' width='16' height='16' />
								Backends
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/certs' className={path === '/certs' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-file-earmark-lock pe-none me-2' width='16' height='16' />
								HTTPS Certificates
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/csr' className={path === '/csr' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-building-lock pe-none me-2' width='16' height='16' />
								Origin CSR
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/ddos_config' className={path === '/map/ddos_config' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-sliders2 pe-none me-2' width='16' height='16' />
								Protection Settings
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/ddos' className={path === '/map/ddos' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-shield-check pe-none me-2' width='16' height='16' />
								Protection Rules
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/rewrite' className={path === '/map/rewrite' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-pencil pe-none me-2' width='16' height='16' />
								Rewrites
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/redirect' className={path === '/map/redirect' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-signpost pe-none me-2' width='16' height='16' />
								Redirects
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/maintenance' className={path === '/map/maintenance' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-info-square pe-none me-2' width='16' height='16' />
								Maintenance Mode
						</Link>
					</li>
				</ul>
				<hr />
				<ul className='nav nav-pills flex-column mb-auto'>
					<li className='nav-item'>
						<Link href='/map/whitelist' className={path === '/map/whitelist' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-person-check pe-none me-2' width='16' height='16' />
								IP Whitelist
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/blockedip' className={path === '/map/blockedip' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-person-slash pe-none me-2' width='16' height='16' />
								IP Blacklist
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/blockedasn' className={path === '/map/blockedasn' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-building-slash pe-none me-2' width='16' height='16' />
								ASN Blacklist
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/blockedcc' className={path === '/map/blockedcc' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-globe2 pe-none me-2' width='16' height='16' />
								Country Blacklist
						</Link>
					</li>
					<li className='nav-item'>
						<Link href='/map/blockedcn' className={path === '/map/blockedcn' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-globe2 pe-none me-2' width='16' height='16' />
								Continent Blacklist
						</Link>
					</li>
				</ul>
			</>);
			bottomLinks = (<>
				<hr />
				<ul className='nav nav-pills flex-column'>
					<li className='nav-item user-select-none'>
						<Link href='/onboarding' className={path === '/onboarding' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-rocket-takeoff pe-none me-2' width='16' height='16' />
								Onboarding
						</Link>
					</li>
					<li className='nav-item user-select-none'>
						<Link href='/kb' className={path.startsWith('/kb') ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
							<i className='bi-book-half pe-none me-2' width='16' height='16' />
								Knowledge Base
						</Link>
					</li>
				</ul>
				<hr />
				<ul className='nav nav-pills flex-column'>
					<li className='nav-item'>
						<form action='/forms/logout' method='POST'>
							<button className='nav-link text-body' type='submit'>
								<i className='bi-door-open pe-none me-2' width='16' height='16' />
								Logout
							</button>
						</form>
					</li>
				</ul>
			</>);
			break;
	}

	return (<>
		<Link href='/' className='d-flex align-items-center mb-3 mb-md-0 text-body text-decoration-none'>
			<ResolvedImage src='/favicon.ico' width='32' height='32' alt=' ' />
			<span className='mx-2 fs-4 text-decoration-none'>BasedFlare</span>
		</Link>
		<hr />
		{mainLinks}
		{bottomLinks}
	</>);

});
