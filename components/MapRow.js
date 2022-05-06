import Link from 'next/link';

export default function MapRow({ name, row, csrf, showValues, mapValueNames }) {

	const [id, key, value] = row.split(' ');

	return (
		<tr className="align-middle">
			<td className="col-1 text-center">
				<form action={`/maps/${name}/delete`} method="post">
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
