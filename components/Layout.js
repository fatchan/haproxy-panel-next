import Head from 'next/head';
import Link from 'next/link';
import MenuLinks from './MenuLinks';
import { withRouter } from 'next/router';

export default withRouter(function Layout({ children, router }) {
	const noSidebar = ['/tos', '/login', '/register', '/changepassword', '/', '/menu'].includes(router.pathname);
	const fullWidth = ['/stats'].includes(router.pathname);
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
							{children}
						</main>

						<footer className='mt-auto text-center text-muted small'>
							<hr />
							<a className='pb-3 fs-xs' href='https://gitgud.io/fatchan/haproxy-panel-next/'>source</a>
							{' '}&bull;{' '}
							<a className='pb-3 fs-xs' target='_blank' rel='noreferrer' href='https://basedstatus.online'>status</a>
							{' '}&bull;{' '}
							<a className='pb-3 fs-xs' target='_blank' rel='noreferrer' href='https://basedflare.com'>basedflare.com</a>
						</footer>

					</div>
				</div>

			</div>
		</>
	);
});
