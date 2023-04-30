import Link from 'next/link';

export default function BackButton({ to }) {
	return (
		<Link href={to}>
			<a className="btn btn-primary ms-1 mt-3">
				Back
			</a>
		</Link>
	)
}
