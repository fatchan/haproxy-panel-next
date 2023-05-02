import Link from 'next/link';

export default function RecordSetRow({ domain, name, recordSet }) {
	const type = recordSet[0]
	const recordSetArray = Array.isArray(recordSet[1]) ? recordSet[1] : [recordSet[1]];
	return (
		<tr className="align-middle">
			<td>
				{name}
			</td>
			<td>
				{type.toUpperCase()}
			</td>
			<td>
				{recordSetArray.map((r, i) => {
					const healthClass = r.h != null
						? (r.h ? "text-success" : "text-danger")
						: "";
					return (<div key={i}>
						<strong>{r.id ? r.id+': ' : ''}</strong>
						<span className={healthClass}>{r.ip || r.host || r.value || r.ns || r.text}</span>
					</div>)
				})}
			</td>
			<td>
				{recordSetArray[0].ttl}
			</td>
			<td>
				{recordSetArray.map((r, i) => (
					<div key={i}>
						{r.geok ? 'Geo: ' : ''}{(r.geov||[]).join(', ')}
					</div>
				))}
			</td>
			<td>
				<Link href={`/dns/${domain}/${name}/${type}`}>
					<a className="btn btn-outline-primary">
						Edit
					</a>
				</Link>
			</td>
		</tr>
	);
}
