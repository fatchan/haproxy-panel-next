export default function MapRow({ row, onDeleteSubmit, name, csrf, showValues, mapValueNames, columnKeys }) {

	const { _id, key, value } = row;

	return (
		<tr className="align-middle">
			<td className="text-left">
				<input onClick={() => onDeleteSubmit(csrf, key)} className="btn btn-danger" type="button" value="×" />
			</td>
			<td>
				{key}
			</td>
			{typeof value === 'string' && showValues === true && (
				<td>
					{mapValueNames[value] || value}
				</td>				
			)}
			{typeof value === 'object' && columnKeys.map((ck, mvi) => (
				<td key={`mvi_${mvi}`}>
					{value[ck].toString()}
				</td>
			))}
		</tr>
	);
	
}
