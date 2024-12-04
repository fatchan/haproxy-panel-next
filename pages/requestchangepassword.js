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
import InfoAlert from '../components/InfoAlert.js';
import { useState } from 'react';

export default function ChangePassword() {

	const router = useRouter();
	const [state, dispatch] = useState();
	const [error, setError] = useState();

	async function changepassword(e) {
		e.preventDefault();
		setError(null);
		await API.requestchangepassword({
			email: e.target.email.value,
		}, dispatch, setError, router);
	}

	return (
		<>
			<Head>
				<title>Change Password</title>
			</Head>

			{error && <ErrorAlert error={error} />}
			<span className='d-flex flex-column align-items-center mt-5 pt-5'>
				<Link href='/' className='d-flex mb-3 text-decoration-none align-items-center'>
					<ResolvedImage src='/favicon.ico' width='24' height='24' alt=' ' />
					<span className='mx-2 fs-4 text-decoration-none'>{process.env.NEXT_PUBLIC_APP_NAME}</span>
				</Link>
				<div>{state && <InfoAlert>{state.message}</InfoAlert>}</div>
				<form className='mb-3' onSubmit={changepassword} action='/forms/requestchangepassword' method='POST'>
					<div className='mb-2'>
						<label className='form-label'>Email
							<input className='form-control' type='text' name='email' maxLength='50' required='required'/>
						</label>
					</div>
					<input className='btn btn-primary w-100' type='submit' value='Request Reset'/>
				</form>
				<span className='fs-xs'>Found your password? <Link href='/login'>Back to Login</Link>.</span>
			</span>

		</>
	);

}
