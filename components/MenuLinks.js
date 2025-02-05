import Image from 'next/image';
let ResolvedImage = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import Link from 'next/link';
import { withRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Router from 'next/router';

export const sections = [
	{
		links: [
			{ href: '/dashboard', label: 'Dashboard Home', icon: 'bi-house' },
		],
	},
	{
		links: [
			{ href: '/domains', subpaths: ['/dns/'], label: 'DNS', icon: 'bi-layers' },
		],
	},
	{
		name: 'Proxying',
		icon: 'bi-hdd-network',
		links: [
			{ href: '/map/hosts', label: 'Backends', icon: 'bi-hdd-network' },
			{ href: '/certs', label: 'HTTPS Certificates', icon: 'bi-file-earmark-lock' },
			{ href: '/csr', label: 'Origin CSR', icon: 'bi-building-lock' },
		],
	},
	{
		name: 'Protection',
		icon: 'bi-shield-check',
		links: [
			{ href: '/map/ddos', label: 'Protection Rules', icon: 'bi-shield-check' },
			{ href: '/map/ddos_config', label: 'Protection Settings', icon: 'bi-sliders2' },
		],
	},
	{
		name: 'Edge Rules',
		icon: 'bi-globe2',
		links: [
			{ href: '/map/redirect', label: 'Domain Redirects', icon: 'bi-arrow-right' },
			{ href: '/map/rewrite', label: 'Path Rewrites', icon: 'bi-pencil' },
			{ href: '/map/blockedip', label: 'IP Blacklist', icon: 'bi-person-slash' },
			{ href: '/map/whitelist', label: 'IP Whitelist', icon: 'bi-person-check' },
			{ href: '/map/blockedasn', label: 'ASN Blacklist', icon: 'bi-building-slash' },
			{ href: '/map/blockedcc', label: 'Country Blacklist', icon: 'bi-globe2' },
			{ href: '/map/blockedcn', label: 'Continent Blacklist', icon: 'bi-globe2' },
			{ href: '/map/maintenance', label: 'Maintenance Mode', icon: 'bi-tools' },
		],
	},
	{
		name: 'Customisation',
		icon: 'bi-brush',
		links: [
			{ href: '/map/images', label: 'Images', icon: 'bi-card-image' },
			{ href: '/map/css', label: 'CSS', icon: 'bi-filetype-css' },
			// { href: '/map/translation', label: 'Custom Translations', icon: 'bi-translate', disabled: true, badge: 'coming soon' },
		],
	},
	{
		links: [
			{ href: '/cache', label: 'Cache Purge', icon: 'bi-trash' },
		],
	},
	{
		links: [
			{ href: '/stats', label: 'Statistics', icon: 'bi-graph-up' },
		],
	},
	{
		links: [
			{ href: '/apikeys', label: 'Api Keys', icon: 'bi-key' },
		],
	},
	{
		links: [
			{ href: '/streams', label: 'Live Streaming', icon: 'bi-cast' },
		],
	},
	{
		name: 'Knowledge Base',
		icon: 'bi-book-half',
		links: [
			{ href: '/kb/firewall', label: 'Firewall', icon: 'bi-bricks' },
			{ href: '/kb/https', label: 'HTTPS & CSRs ', icon: 'bi-file-earmark-lock' },
			{ href: '/kb/debug', label: 'Debug URLs', icon: 'bi-bug' },
		],
	}
];

const MenuLinks = ({ router }) => {
	const [path, setPath] = useState(router.asPath);
	const [openSections, setOpenSections] = useState({});

	const renderSection = (section, index) => {
		return section.links.length === 1
			? <ul key={`section_${section.links[0].name}_${index}`} className='nav nav-pills mb-2'>
				<li className='nav-item w-100' key={`${section.name}_${index}`}>
					<Link
						href={section.links[0].href}
						className={path === section.links[0].href || section.links[0]?.subpaths?.some(l => path.startsWith(l)) ? 'nav-link active' : 'nav-link text-body'}
						aria-current='page'
						onClick={() => handleLinkClick(section.name)}
					>
						<i className={`${section.links[0].icon} pe-none me-2`} width='16' height='16' />
						{section.links[0].label}
						{section.links[0].badge && <small className='alert alert-warning text-uppercase p-0 px-1 ms-2' style={{ fontSize: 10 }} role='alert'>{section.links[0].badge}</small>}
					</Link>
				</li>
			</ul>
			: <div key={`${section.name}_${index}`}>
				<button
					onClick={() => toggleSection(section.name)}
					className='nav nav-link d-flex align-items-center btn-link text-body text-decoration-none w-100'
				>
					<i className={`${section.icon} pe-2`} width='16' height='16' />
					{section.name}
					{<i
						className={`bi-chevron-down ms-auto transition ${openSections[section.name] ? 'rotate' : ''}`}
						width='16'
						height='16'
						style={{ transition: 'transform 0.3s ease', transform: openSections[section.name] ? 'rotate(180deg)' : 'rotate(0deg)' }}
					/>}
				</button>
				<div className='ps-3 my-1' style={{ borderLeft: '1px solid var(--bs-dark-text-emphasis)!important', maxHeight: openSections[section.name] ? `${section.links.length * 60}px` : '0', overflow: 'hidden', transition: 'max-height 0.2s ease-in-out' }}>
					<ul className='nav nav-pills mb-auto'>
						{section.links.map((link, linkIndex) => (
							<li className='nav-item w-100' key={`${section.name}_${linkIndex}`}>
								<Link
									href={link.href}
									style={{
										pointerEvents: link.disabled ? 'none' : 'auto',
									}}
									className={path === link.href || link?.subpaths?.some(l => path.startsWith(l)) ? 'nav-link active' : 'nav-link text-body'}
									aria-current='page'
									onClick={() => handleLinkClick(section.name)}
								>
									<i className={`${link.icon} pe-none me-2`} width='16' height='16' />
									{link.label}
									{link.badge && <small className='alert alert-warning text-uppercase p-0 px-1 ms-2' style={{ fontSize: 10 }} role='alert'>{link.badge}</small>}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>;
	};

	useEffect(() => {
		Router.events.on('routeChangeStart', setPath);
		sections.forEach(section => {
			if (section.links.some(link => {
				console.log(link?.subpaths, path);
				return path.startsWith(link.href) || link?.subpaths?.some(l => path.startsWith(l));
			})) {
				setOpenSections(prev => ({ ...prev, [section.name]: true }));
			}
		});
		return () => {
			Router.events.off('routeChangeStart', setPath);
		};
	}, [router.pathname]);

	//meh
	const toggleSection = (section) => {
		setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
	};

	const handleLinkClick = (section) => {
		setOpenSections((prev) => ({ ...prev, [section]: true }));
	};

	const bottomLinks = (
		<>
			<hr className='mt-auto' />
			{renderSection(sections[sections.length - 1])}
			<ul className='nav nav-pills flex-column'>
				<li className='nav-item user-select-none'>
					<Link href='/onboarding' className={path === '/onboarding' ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
						<i className='bi-rocket-takeoff pe-none me-2' width='16' height='16' />
						Onboarding
					</Link>
				</li>
				<li className='nav-item'>
					<Link href='/billing' className={path.startsWith('/billing') ? 'nav-link active' : 'nav-link text-body'} aria-current='page'>
						<i className='bi-wallet2 pe-none me-2' width='16' height='16' />
						Billing
					</Link>
				</li>
				<li className='nav-item'>
					<form action='/forms/logout' method='POST'>
						<button className='nav-link text-body' type='submit'>
							<i className='bi-door-open pe-none me-2' width='16' height='16' />
							Logout
						</button>
					</form>
				</li>
			</ul>
		</>
	);

	return (
		<>
			<Link href='/' className='d-flex align-items-center mb-3 mb-md-0 text-body text-decoration-none'>
				<ResolvedImage src='/favicon.ico' width='32' height='32' alt=' ' />
				<span className='mx-2 fs-4 text-decoration-none'>{process.env.NEXT_PUBLIC_APP_NAME}</span>
			</Link>
			<hr />
			{sections.slice(0, -1).map(renderSection)}
			{bottomLinks}
		</>
	);
};

export default withRouter(MenuLinks);
