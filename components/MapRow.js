export default function MapRow({ row, onDeleteSubmit, name, csrf, showValues, mapValueNames }) {

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
			{showValues === true && (
				<td>
					{mapValueNames[value] || value}
				</td>				
			)}
		</tr>
	);
	
}
