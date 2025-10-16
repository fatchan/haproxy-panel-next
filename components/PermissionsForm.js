import React from 'react';
import { Permissions, Metadata } from '../lib/permissions/permissions.js';
import Permission from '../lib/permissions/permission.js';

function PermissionRow({ bit, editingPermissions, currentPermissions }) {
	const perm = editingPermissions[bit];

	const parents = perm.parents;
	const parentAllowed = parents == null || currentPermissions.hasAny(...parents);
	const parentLabel = !parentAllowed
		? parents
			? parents.map((p) => Metadata[p]?.label).join('\n')
			: ''
		: '';

	return (
		<tr key={bit}>
			<td>
				<input
					type='checkbox'
					name={`permission_bit_${bit}`}
					value={bit}
					defaultChecked={!!perm.state}
					disabled={!parentAllowed}
					title={!parentAllowed ? `Requires permission "${parentLabel}"` : ''}
				/>
			</td>
			<td>{perm?.label}</td>
			<td>
				{perm.description}
			</td>
		</tr>
	);
}

export default function PermissionsForm({ editingPermissions, currentPermissions }) {

	//TODO: change to have conditional for filter once perms other than org are editable
	const bits = Object.keys(editingPermissions)
		.filter((p) => Permissions._ORG_BITS.includes(parseInt(p, 10)))
		.map((p) => parseInt(p, 10));

	const editing = new Permission(editingPermissions.toString('base64'));
	editing.applyInheritance();

	const current = new Permission(currentPermissions.toString('base64'));
	current.applyInheritance();

	// console.log('editing', editing);
	// console.log('current', current);
	// console.log(current.get(Permissions.ORG_OWNER))

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
							editingPermissions={editing.toJSON()} //toJSON for easier handling
							currentPermissions={current}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
