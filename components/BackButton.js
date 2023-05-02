import Link from 'next/link';

export default function BackButton({ to }) {
	return (
		<Link href={to}>
			<a className="btn btn-primary">
				Back
			</a>
		</Link>
	)
}
