export default function MapRow({ row, onDeleteSubmit, name, csrf, showValues, mapValueNames, columnKeys }) {

	const { _id, key, value } = row;

	return (
		<tr className="align-middle">
			<td className="col-1 text-center">
				<form onSubmit={onDeleteSubmit} action={`/forms/map/${name}/delete`} method="post">
					<input type="hidden" name="_csrf" value={csrf} />
					<input type="hidden" name="key" value={key} />
					<input className="btn btn-danger" type="submit" value="×" />
				</form>
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
