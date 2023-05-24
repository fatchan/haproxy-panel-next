export default function ClusterRow({ i, cluster, setCluster, deleteCluster, csrf, user }) {

	const splitCluster = cluster.split(',');

	return (
		<tr className="align-middle">
			<td className="text-left" style={{width:0}}>
				<input onClick={() => deleteCluster(csrf, key)} className="btn btn-danger" type="button" value="×" />
			</td>
			<td className="col-1 text-center">
				<input onSubmit={() => setCluster(csrf, i)} className="btn btn-primary" type="button" value="Select" disabled={(i === user.activeCluster ? 'disabled' : null)} />
			</td>
			<td>
				({splitCluster.length}): {splitCluster.map(c => new URL(c).hostname).join(', ')}
			</td>
		</tr>
	);

};
