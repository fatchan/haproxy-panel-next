import React from 'react';
import { Permissions } from '../lib/permissions/permissions.js';

function PermissionRow({ bit, permissions }) {
	const permission = permissions[bit];

	// const parents = permission.parents;
	// const parentAllowed = parents == null || permissions.hasAny(...parents);
	// const parentLabel = !parentAllowed
	//   ? parents
	//     ? parents.map((p) => jsonPermissions[p].label).join("\n")
	//     : ""
	//   : "";

	return (
		<tr key={bit}>
			<td>
				<input
					type='checkbox'
					name={`permission_bit_${bit}`}
					value={bit}
					defaultChecked={!!permission.state}
					// disabled={!parentAllowed || !!permission.block}
					onChange={() => { }}
				/>
			</td>

			<td>{permission.label}</td>

			<td>
				{/*
        {!parentAllowed && parentLabel && (
          <>
            <span>{`Requires permission "${parentLabel}"`}</span>
            {" - "}
          </>
        )}
        */}
				{permission.description || permission.desc}
			</td>
		</tr>
	);
}

export default function PermissionsForm({ permissions }) {

	const bits = Object.keys(permissions)
		.filter((p) => Permissions._ORG_BITS.includes(parseInt(p, 10)))
		.map((p) => parseInt(p, 10));

	return (
		<div className='table-responsive round-border mb-2'>
			<table className='table text-nowrap'>
				<tbody>
					<tr className='align-middle'>

						<th />
						<th>Permission</th>
						<th>Description</th>
					</tr>

					{bits.map((bit) => (
						<PermissionRow
							key={bit}
							bit={bit}
							permissions={permissions}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
