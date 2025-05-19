import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import MenuLinks from './MenuLinks';
import { withRouter } from 'next/router';
import { footerLinks } from '../instance-config.js';
import InfoAlert from './InfoAlert';
import * as API from '../api.js';

export default withRouter(function Layout({ children, router, user }) {
	const [incidents, setIncidents] = useState([]);
	useEffect(() => {
		API.getIncidents(setIncidents, (e) => { console.warn('Failed to fetch incident data:', e); }, router);
	}, []);

	const noSidebar = ['/tos', '/login', '/register', '/verifyemail', '/changepassword', '/requestchangepassword', '/', '/menu'].includes(router.pathname);
	const fullWidth = ['/stats', '/dashboard'].includes(router.pathname);

	return (
		<>

			<Head>
				<meta charSet='utf-8'/>
				<meta name='viewport' content='width=device-width initial-scale=1'/>
				<link rel='shortcut icon' href='/favicon.ico' />
			</Head>

			<div className='row h-100 p-0 m-0'>

				{!noSidebar && <div className='col-auto sidebar h-100 m-0 px-0'>
					<div className='d-flex flex-column flex-shrink-0 p-3 h-100 overflow-auto' style={{ width: '265px' }}>
						<MenuLinks />
					</div>
				</div>}

				<div className='col-1 flex-fill m-0 px-0 h-100 overflow-auto'>
					<div className='p-3 h-100 d-flex flex-column'>
						<main className={`mx-auto col col-12 ${fullWidth ? '' : 'col-xl-8'}`}>
							{!noSidebar && <span className='mobile-btn'>
								<Link href='/menu' className='btn btn-sm btn-primary d-inline-block'>
									<i className='bi-list pe-none me-2' width='16' height='16' />
									Menu
								</Link>
								<hr />
							</span>}
							{user && user.emailVerified === false && <div className='alert alert-warning' role='alert'>
								<i className='bi-envelope-exclamation pe-2' width='16' height='16' />
								Please check your email inbox and click the link to verify your email.
							</div>}
							{incidents && incidents.map((inc, i) => (
								<InfoAlert key={`incident_${i}`}>
									<h6>{inc.title}</h6>
									<small>{inc.description}</small>
								</InfoAlert>
							))}
							{children}
						</main>
						<footer className='mt-auto text-center text-muted small'>
							<hr />
							{footerLinks.map((link, index) => (
								<span key={index}>
									<a href={link.href} target='_blank' rel='noreferrer'>
										{link.name}
									</a>
									{index !== footerLinks.length - 1 && <span>{' '}&bull;{' '}</span>}
								</span>
							))}
						</footer>

					</div>
				</div>

			</div>
		</>
	);
});
