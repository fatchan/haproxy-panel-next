import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import * as API from '../api.js'
import ErrorAlert from '../components/ErrorAlert.js';
import { useState } from 'react';

export default function ChangePassword() {

	const router = useRouter();
	const [error, setError] = useState();

	async function changepassword(e) {
		e.preventDefault();
		return setError('notImplemented');
		await API.changepassword({
			username: e.target.username.value,
			password: e.target.password.value,
			repeat_password: e.target.repeat_password.value,
		}, null, setError, router);
		router.push('/login');
	}

	return (
		<>
			<Head>
				<title>Change Password</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<span className="d-flex flex-column align-items-center mt-5 pt-5">
				<Link href="/">
					<a className="d-flex mb-3 text-decoration-none text-body">
						<Image src="/favicon.ico" layout="fixed" width="24" height="24" alt=" " />
						<span className="mx-2 fs-4">BasedFlare</span>
					</a>
				</Link>
				<form className="mb-3" onSubmit={changepassword} action="/forms/changepassword" method="POST">
					<div className="mb-2">
						<label className="form-label">Email
							<input className="form-control" type="text" name="username" maxLength="50" required="required"/>
						</label>
					</div>
					<input className="btn btn-primary w-100" type="submit" value="Request Reset"/>
				</form>
				<span className="fs-xs">Found your password? <Link href="/login">Back to Login</Link>.</span>
			</span>

		</>
	);

}
