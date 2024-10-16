export default function InfoAlert({ children }) {
	return children && (
		<div className='alert alert-info' role='alert'>
			{children}
		</div>
	);
}
