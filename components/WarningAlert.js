export default function WarningAlert({ text }) {
	return text && (
		<div className='alert alert-warning' role='alert'>
			{text}
		</div>
	);
}

