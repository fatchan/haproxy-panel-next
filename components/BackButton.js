import Link from 'next/link';

export default function BackButton({ to }) {
	return (
		<Link href={to}>
			<a className="btn btn-primary mt-3 ms-1 ps-2">
				<i className="bi-chevron-left pe-2" width="16" height="16" />
				Back
			</a>
		</Link>
	)
}
