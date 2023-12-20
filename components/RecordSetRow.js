import Link from 'next/link';
import * as API from '../api.js';

export default function RecordSetRow({ dispatch, setError, router, domain, name, recordSet, csrf }) {
	const type = recordSet[0];
	const recordSetArray = Array.isArray(recordSet[1]) ? recordSet[1] : [recordSet[1]];
	async function deleteDnsRecord(e) {
		e.preventDefault();
		await API.deleteDnsRecord(domain, name, type, Object.fromEntries(new FormData(e.target)), dispatch, setError, router);
		await API.getDnsDomain(domain, dispatch, setError, router);
	}
	const recordSetContent = recordSetArray.map((r, i) => {
		const healthClass = r.h != null
			? (r.u === true
				? 'text-success'
				: (r.fb
					? 'text-warning'
					: 'text-danger'))
			: '';
		//todo: make fbrecord correctly calculate multiple fallbacks, 3 mode, etc
		const fbRecord = healthClass === 'text-warning'
			&& r.sel === 1
			&& recordSetArray.find(fbr => fbr.id === r.fb[0]);
		return (<div key={i}>
			<strong>{r.id ? r.id+': ' : ''}</strong>
			<span className={healthClass}>{r.ip || r.host || r.value || r.ns || r.text || r.target}</span>
			{fbRecord && <>{' -> '}<span className='text-success'>{fbRecord.ip}</span></>}
			{r.geok ? `${r.geok === 'cn' ? ' Continents' : ' Countries'}: ` : ''}{(r.geov||[]).join(', ')}
		</div>);
	});
	return (
		<tr className='align-middle'>
			<td>
				<span className='d-inline-block'>
					<form onSubmit={deleteDnsRecord} action={`/forms/dns/${domain}/${name}/${type}/delete`} method='post'>
						<input type='hidden' name='_csrf' value={csrf} />
						<button className='btn btn-sm btn-danger' type='submit'>
							<i className='bi-trash-fill pe-none' width='16' height='16' />
						</button>
					</form>
				</span>
				{recordSetArray.length > 0 && recordSetArray[0].l !== true && <Link href={`/dns/${domain}/${name}/${type}`} className='btn btn-sm btn-primary ms-2'>
					<i className='bi-pencil-fill pe-none' width='16' height='16' />
				</Link>}
			</td>
			<td>
				{name}
			</td>
			<td>
				{type.toUpperCase()}
			</td>
			<td>
				{recordSetArray.length > 3
					? <details><summary>Expand ({recordSetArray.length})</summary>{recordSetContent}</details>
					: recordSetContent}
			</td>
			<td>
				{recordSetArray && recordSetArray.length > 0 ? recordSetArray[0].ttl : '-'}
			</td>
			<td>
				{recordSetArray && recordSetArray.length > 0 && recordSetArray[0].t && <div className='text-warning'>Template</div>}
				{recordSetArray && recordSetArray.length > 0 && recordSetArray[0].l && <div className='text-danger'>Locked</div>}
			</td>
		</tr>
	);
}
