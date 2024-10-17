import Head from 'next/head';
import Image from 'next/image';
// TODO: Remove once https://github.com/vercel/next.js/issues/52216 is resolved.
// next/image` seems to be affected by a default + named export bundling bug.
let ResolvedImage = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}

import Link from 'next/link';

export default function Index() {
	return (<>
		<Head>
			<title>BasedFlare</title>
		</Head>

		<span className='d-flex flex-column align-items-center mt-5 pt-5'>
			<Link href='#!' className='d-flex mb-3 text-decoration-none align-items-center'>
				<ResolvedImage src='/favicon.ico' width='24' height='24' alt=' ' />
				<span className='mx-2 fs-4 text-decoration-none'>BasedFlare</span>
			</Link>
			<span className='d-flex'>
				<div className='me-2'>
					<Link href='/dashboard' className='btn btn-sm btn-primary'>
						<i className='bi-person-square pe-none me-2' width='16' height='16' />
							Dashboard
					</Link>
				</div>
				<div>
					<Link href='/login' className='btn btn-sm btn-primary'>
						<i className='bi-door-closed pe-none me-2' width='16' height='16' />
							Login
					</Link>
				</div>
			</span>
		</span>

	</>);
}
