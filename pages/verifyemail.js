import Head from 'next/head';
import Image from 'next/image';
// TODO: Remove once https://github.com/vercel/next.js/issues/52216 is resolved.
// next/image` seems to be affected by a default + named export bundling bug.
let ResolvedImage = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import { useRouter } from 'next/router';
import Link from 'next/link';
import * as API from '../api.js';
import ErrorAlert from '../components/ErrorAlert.js';
import { useState, useEffect } from 'react';

export default function VerifyEmil() {

	const router = useRouter();
	const { token } = router.query || {};
	const [error, setError] = useState();
	async function verifyEmail() {
		await API.verifyemail({
			token,
		}, null, setError, router);
	}

	useEffect(() => {
		if (token) {
			verifyEmail();
		}
	}, [token]);

	return (
		<>
			<Head>
				<title>Email Verification</title>
			</Head>

			<span className='d-flex flex-column align-items-center mt-5 pt-5'>
				<Link href='/' className='d-flex mb-3 text-decoration-none align-items-center'>
					<ResolvedImage src='/favicon.ico' width='24' height='24' alt=' ' />
					<span className='mx-2 fs-4 text-decoration-none'>{process.env.NEXT_PUBLIC_APP_NAME}</span>
				</Link>
				<div className='d-flex flex-column'>
					{error
						? <ErrorAlert error={error} />
						: <span>
							Verifying email...
							<span style={{ width: 15, height: 15 }} className='ms-1 spinner-border' role='status' />
						</span>}
				</div>
			</span>

		</>
	);

}
