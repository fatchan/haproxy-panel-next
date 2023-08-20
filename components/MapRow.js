export default function MapRow({ row, onDeleteSubmit, name, csrf, showValues, mapValueNames, columnKeys }) {

	const { _id, key, value } = row;

	return (
		<tr className="align-middle">
			<td className="text-left">
				<a className="btn btn-sm btn-danger" onClick={() => onDeleteSubmit(csrf, key)}>
					<i className="bi-trash-fill pe-none" width="16" height="16" />
				</a>
			</td>
			<td>
				{key}
			</td>
			{typeof value === 'string' && showValues === true && (
				<td>
					{mapValueNames[value] || value}
				</td>
			)}
			{typeof value === 'object' && columnKeys.map((ck, mvi) => {
				let displayValue = mapValueNames[value[ck].toString()] || value[ck].toString();
				if (typeof value[ck] === 'boolean') {
					console.log(value[ck])
					displayValue = value[ck] === true
						? <span className="text-success">
							<i className="bi-check-lg pe-none me-2" width="16" height="16" />
						</span>
						: <span className="text-secondary">
							<i className="bi-dash-lg pe-none me-2" width="16" height="16" />
						</span>;
				}
				return <td key={`mvi_${mvi}`}>
					{displayValue}
				</td>
			})}
		</tr>
	);

}
