import asnMap from '../maps/asn.json';

export default function MapRow({ row, onDeleteSubmit, name, csrf, showValues, mapValueNames, columnKeys, mapNote, showNote }) {

	const { _id, key, value } = row;

	return (
		<tr className='align-middle'>
			<td className='text-left'>
				<a className='btn btn-sm btn-danger' onClick={() => {
					name === 'hosts' && confirm('If you get an error deleting a backend please contact support');
					onDeleteSubmit(csrf, key);
				}}>
					<i className='bi-trash-fill pe-none' width='16' height='16' />
				</a>
			</td>
			<td>
				{key}{name === 'blockedasn' && asnMap[key] && ` (${asnMap[key]})`}
			</td>
			{showNote && <td>
				{mapNote
					? mapNote
					: <span className='text-secondary'>
						<i className='bi-dash-lg pe-none me-2' width='16' height='16' />
					</span>}
			</td>}
			{typeof value === 'string' && showValues === true && (
				<td>
					{mapValueNames[value] || value}
				</td>
			)}
			{typeof value === 'object' && columnKeys.map((ck, mvi) => {
				let displayValue = value[ck] && (mapValueNames[value[ck].toString()] || value[ck].toString());
				if (typeof value[ck] === 'boolean') {
					displayValue = value[ck] === true
						? <span className='text-success'>
							<i className='bi-check-lg pe-none me-2' width='16' height='16' />
						</span>
						: <span className='text-secondary'>
							<i className='bi-dash-lg pe-none me-2' width='16' height='16' />
						</span>;
				}
				return <td key={`mvi_${mvi}`}>
					{displayValue}
				</td>;
			})}
		</tr>
	);

}
