import Head from 'next/head';
import { useRouter } from 'next/router';
import ApiCall from '../api.js';

const Register = () => {

	const router = useRouter();

	async function register(e) {
		e.preventDefault();
		await ApiCall('/forms/regiser', 'POST', JSON.stringify({
			username: e.target.username.value,
			password: e.target.password.value,
			rpasword: e.target.repeat_password.value,
		 }), null, 0.5, router);
		router.push('/login');
	}
	
	return (
		<>
			<Head>
				<title>Register</title>
			</Head>

			<h5 className="fw-bold">Register</h5>
			<form onSubmit={register} action="/forms/register" method="POST">
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
				<input className="btn btn-primary" type="submit" value="Submit"/>
			</form>

		</>
	);

};

export default Register;
