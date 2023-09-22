import Image from 'next/image';
// TODO: Remove once https://github.com/vercel/next.js/issues/52216 is resolved.
// next/image` seems to be affected by a default + named export bundling bug.
let ResolvedImage = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import Link from 'next/link';
import { withRouter } from 'next/router';

export default withRouter(function MenuLinks({ router }) {
	return (<>
		<Link href='/' className='d-flex align-items-center mb-3 mb-md-0 text-body text-decoration-none'>
			<ResolvedImage src='/favicon.ico' width='32' height='32' alt=' ' />
			<span className='mx-2 fs-4 text-decoration-none'>BasedFlare</span>
		</Link>
		<hr />
		<ul className='nav nav-pills flex-column mb-auto'>
			<li className='nav-item'>
				<Link href='/account' className={router.pathname === '/account' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-person-square pe-none me-2' width='16' height='16' />
						Account
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/domains' className={router.pathname === '/domains' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-layers pe-none me-2' width='16' height='16' />
						Domains
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/hosts' className={router.pathname === '/map/[name]' && router.query.name === 'hosts' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-hdd-network pe-none me-2' width='16' height='16' />
						Backends
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/certs' className={router.pathname === '/certs' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-file-earmark-lock pe-none me-2' width='16' height='16' />
						HTTPS Certificates
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/csr' className={router.pathname === '/csr' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-building-lock pe-none me-2' width='16' height='16' />
						Origin CSR
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/ddos_config' className={router.pathname === '/map/[name]' && router.query.name === 'ddos_config' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-sliders2 pe-none me-2' width='16' height='16' />
						Protection Settings
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/ddos' className={router.pathname === '/map/[name]' && router.query.name === 'ddos' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-shield-check pe-none me-2' width='16' height='16' />
						Protection Rules
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/rewrite' className={router.pathname === '/map/[name]' && router.query.name === 'rewrite' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-pencil pe-none me-2' width='16' height='16' />
						Rewrites
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/redirect' className={router.pathname === '/map/[name]' && router.query.name === 'redirect' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-signpost pe-none me-2' width='16' height='16' />
						Redirects
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/whitelist' className={router.pathname === '/map/[name]' && router.query.name === 'whitelist' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-person-check pe-none me-2' width='16' height='16' />
						IP Whitelist
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/blockedip' className={router.pathname === '/map/[name]' && router.query.name === 'blockedip' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-person-slash pe-none me-2' width='16' height='16' />
						IP Blacklist
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/blockedasn' className={router.pathname === '/map/[name]' && router.query.name === 'blockedasn' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-building-slash pe-none me-2' width='16' height='16' />
						ASN Blacklist
				</Link>
			</li>
			<li className='nav-item'>
				<Link href='/map/maintenance' className={router.pathname === '/map/[name]' && router.query.name === 'maintenance' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-info-square pe-none me-2' width='16' height='16' />
						Maintenance Mode
				</Link>
			</li>
		</ul>
		<hr />
		<ul className='nav nav-pills flex-column'>
			<li className='nav-item user-select-none'>
				<Link href='/onboarding' className={router.pathname === '/onboarding' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
					<i className='bi-rocket-takeoff pe-none me-2' width='16' height='16' />
						Onboarding
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
});
