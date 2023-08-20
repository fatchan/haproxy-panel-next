export default function ClusterRow({ i, cluster, setCluster, deleteCluster, csrf, user }) {

	const splitCluster = cluster.split(',');

	return (
		<tr className="align-middle">
			<td className="text-left" style={{width:0}}>
				<a className="btn btn-sm btn-danger" onClick={() => deleteCluster(csrf, key)}>
					<i className="bi-trash-fill pe-none" width="16" height="16" />
				</a>
			</td>
			<td className="col-1 text-center">
				<input onSubmit={() => setCluster(csrf, i)} className="btn btn-sm btn-primary" type="button" value="Select" disabled={(i === user.activeCluster ? 'disabled' : null)} />
			</td>
			<td>
				({splitCluster.length}): {splitCluster.map(c => new URL(c).hostname).join(', ')}
			</td>
		</tr>
	);

};
