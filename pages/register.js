import Head from 'next/head';

const Register = () => (
	<>
		<Head>
			<title>Register</title>
		</Head>

		<h5 className="fw-bold">Register</h5>
		<form action="/register" method="POST">
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

export default Register;
