import Link from 'next/link';

export default function MapLink({ map }) {
	return (
		<Link href={`/map/${map.name}`}>
			<a className="list-group-item list-group-item-action d-flex align-items-start">
				<span className="ms-2 me-auto">
					<span className="fw-bold">
						{map.fname}
						<span className="fw-normal">
							{' '}- {map.description}
						</span>
					</span>
				</span>
				<span className="badge bg-primary rounded-pill">
					{map.count}
				</span>
			</a>
		</Link>
	)
}
