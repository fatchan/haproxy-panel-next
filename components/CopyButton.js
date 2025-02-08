import { toast } from 'react-hot-toast';

const CopyButton = ({ text }) => {
	const handleCopy = () => {
		navigator.clipboard.writeText(text)
			.then(() => {
				toast.success('Copied to clipboard!');
			})
			.catch(() => {
				toast.error('Failed to copy!');
			});
	};

	return (
		<button
			onClick={handleCopy}
			className='btn btn-outline-primary d-flex align-items-center me-2'
			aria-label='Copy to clipboard'
		>
			<i className='bi bi-clipboard mr-2' />
		</button>
	);
};

export default CopyButton;
