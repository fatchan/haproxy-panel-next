export default function ErrorAlert({ error }) {
	return error && (
		<div className='alert alert-danger' role='alert'>
			{error}
		</div>
	);
}
