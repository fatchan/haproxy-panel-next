export default function InfoAlert({ children }) {
	return children && (
		<div className='alert alert-success' role='alert'>
			{children}
		</div>
	);
}
