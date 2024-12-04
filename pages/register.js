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

export default function Register() {

	const router = useRouter();
	const [error, setError] = useState();
	const [state, dispatch] = useState();

	async function register(e) {
		e.preventDefault();
		await API.register({
			username: e.target.username.value,
			password: e.target.password.value,
			email: e.target.email.value,
			repeat_password: e.target.repeat_password.value,
		}, dispatch, setError, router);
	}

	return (
		<>
			<Head>
				<title>Register</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<span className='d-flex flex-column align-items-center mt-5 pt-5'>
				<Link href='/' className='d-flex mb-3 text-decoration-none align-items-center'>
					<ResolvedImage src='/favicon.ico' width='24' height='24' alt=' ' />
					<span className='mx-2 fs-4 text-decoration-none'>{process.env.NEXT_PUBLIC_APP_NAME}</span>
				</Link>
				<div>{state && <InfoAlert>{state.message}</InfoAlert>}</div>
				<form className='mb-3' onSubmit={register} action='/forms/register' method='POST'>
					<div className='mb-2'>
						<label className='form-label w-100'>Username
							<input className='form-control' type='text' name='username' maxLength='50' required='required'/>
						</label>
					</div>
					<div className='mb-2'>
						<label className='form-label w-100'>Email
							<input className='form-control' type='email' name='email' maxLength='200' required='required'/>
						</label>
					</div>
					<div className='mb-2'>
						<label className='form-label w-100'>Password
							<input className='form-control' type='password' name='password' maxLength='100' required='required'/>
						</label>
					</div>
					<div className='mb-2'>
						<label className='form-label w-100'>Repeat Password
							<input className='form-control' type='password' name='repeat_password' maxLength='100' required='required'/>
						</label>
					</div>
					<div className='mb-3'>
						<div className='form-check'>
							<input className='form-check-input' type='checkbox' name='tos' value='true' id='tos' required />
							<label className='form-check-label' htmlFor='tos'>I agree to the <Link href='/tos' passHref target='_blank'>terms of service</Link>.</label>
						</div>
					</div>
					<input className='btn btn-primary w-100' type='submit' value='Register'/>
				</form>
				<span className='fs-xs'>Already have an account? <Link href='/login'>Login here</Link>.</span>
			</span>

		</>
	);

}
