import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import * as API from '../api.js'
import ErrorAlert from '../components/ErrorAlert.js';
import { useState } from 'react';

export default function Register() {

	const router = useRouter();
	const [error, setError] = useState();

	async function register(e) {
		e.preventDefault();
		await API.register({
			username: e.target.username.value,
			password: e.target.password.value,
			repeat_password: e.target.repeat_password.value,
		}, null, setError, router);
		router.push('/login');
	}

	return (
		<>
			<Head>
				<title>Register</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<span className="d-flex flex-column align-items-center mt-5 pt-5">
				<span className="d-flex mb-3">
					<Image src="/favicon.ico" layout="fixed" width="24" height="24" alt=" " />
					<span className="mx-2 fs-4">BasedFlare</span>
				</span>
				<form className="mb-3" onSubmit={register} action="/forms/register" method="POST">
					<div className="mb-2">
						<label className="form-label">Username
							<input className="form-control" type="text" name="username" maxLength="50" required="required"/>
						</label>
					</div>
					<div className="mb-2">
						<label className="form-label">Password
							<input className="form-control" type="password" name="password" maxLength="100" required="required"/>
						</label>
					</div>
					<div className="mb-2">
						<label className="form-label">Repeat Password
							<input className="form-control" type="password" name="repeat_password" maxLength="100" required="required"/>
						</label>
					</div>
					<input className="btn btn-primary w-100" type="submit" value="Register"/>
				</form>
				<span className="fs-xs">Already have an account? <Link href="/register">Login here</Link>.</span>
			</span>

		</>
	);

}
