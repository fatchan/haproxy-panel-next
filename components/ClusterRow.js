export default function ClusterRow({ i, cluster, setCluster, deleteCluster, csrf, user }) {

	return (
		<tr className="align-middle">
			<td className="col-1 text-center">
				<form onSubmit={deleteCluster} action="/forms/cluster/delete" method="post">
					<input type="hidden" name="_csrf" value={csrf} />
					<input type="hidden" name="cluster" value={cluster} />
					<input className="btn btn-danger" type="submit" value="×" />
				</form>
			</td>
			<td className="col-1 text-center">
				<form onSubmit={setCluster} action="/forms/cluster" method="post">
					<input type="hidden" name="_csrf" value={csrf} />
					<input type="hidden" name="cluster" value={i} />
					<input className="btn btn-primary" type="submit" value="Select" disabled={(i === user.activeCluster ? 'disabled' : null)} />
				</form>
			</td>
			<td>
				{cluster}
			</td>
		</tr>
	);

};
