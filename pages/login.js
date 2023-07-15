import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import * as API from '../api.js'
import ErrorAlert from '../components/ErrorAlert.js';
import { useState } from 'react';

export default function Login() {

	const router = useRouter();
	const [error, setError] = useState();

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

			<span className="d-flex flex-column align-items-center mt-5 pt-5">
				<Link href="/">
					<a className="d-flex mb-3 text-decoration-none align-items-center">
						<Image src="/favicon.ico" layout="fixed" width="24" height="24" alt=" " />
						<span className="mx-2 fs-4 text-decoration-none">BasedFlare</span>
					</a>
				</Link>
				<form className="mb-3" onSubmit={login} action="/forms/login" method="POST">
					<div className="mb-2">
						<label className="form-label w-100">Username
							<input className="form-control" type="text" name="username" maxLength="50" required="required"/>
						</label>
					</div>
					<div className="mb-2">
						<label className="form-label w-100">Password
							<input className="form-control" type="password" name="password" maxLength="100" required="required"/>
						</label>
					</div>
					<div className="mb-2">
						<div className="form-check">
							<input className="form-check-input" type="checkbox" name="tos" value="true" id="tos" required />
							<label className="form-check-label" htmlFor="tos">I agree to the <Link href="/tos" passHref><a target="_blank">terms of service</a></Link>.</label>
						</div>
					</div>
					<input className="btn btn-primary w-100" type="submit" value="Login"/>
				</form>
				<span className="fs-xs">Don&apos;t have an account? <Link href="/register">Register here</Link>.</span>
				<span className="fs-xs"><Link href="/changepassword">Forgot your password?</Link></span>
			</span>

		</>
	);

}
