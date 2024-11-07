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

export default function Login() {

	const router = useRouter();
	const [error, setError] = useState();

	const { verify_email, change_password } = router.query || {};

	async function login(e) {
		e.preventDefault();
		await API.login({
			username: e.target.username.value,
			password: e.target.password.value,
		}, null, setError, router);
	}

	return (
		<>
			<Head>
				<title>Login</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<span className='d-flex flex-column align-items-center mt-5 pt-5'>
				<Link href='/' className='d-flex mb-3 text-decoration-none align-items-center'>
					<ResolvedImage src='/favicon.ico' width='24' height='24' alt=' ' />
					<span className='mx-2 fs-4 text-decoration-none'>BasedFlare</span>
				</Link>
				{/*todo: refactor*/}
				{verify_email && <InfoAlert>Email verified successfully, you may now login</InfoAlert>}
				{change_password && <InfoAlert>Password updated successfully, you may now login</InfoAlert>}
				<form className='mb-3' onSubmit={login} action='/forms/login' method='POST'>
					<div className='mb-2'>
						<label className='form-label w-100'>Username
							<input className='form-control' type='text' name='username' maxLength='50' required='required'/>
						</label>
					</div>
					<div className='mb-2'>
						<label className='form-label w-100'>Password
							<input className='form-control' type='password' name='password' maxLength='100' required='required'/>
						</label>
					</div>
					<div className='mb-3'>
						<div className='form-check'>
							<input className='form-check-input' type='checkbox' name='tos' value='true' id='tos' required />
							<label className='form-check-label' htmlFor='tos'>I agree to the <Link href='/tos' passHref target='_blank'>terms of service</Link>.</label>
						</div>
					</div>
					<input className='btn btn-primary w-100' type='submit' value='Login'/>
				</form>
				<span className='fs-xs'>Don&apos;t have an account? <Link href='/register'>Register here</Link>.</span>
				<span className='fs-xs'><Link href='/requestchangepassword'>Forgot your password?</Link></span>
			</span>

		</>
	);

}
