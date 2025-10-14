'use strict';

import { Permissions, Metadata } from './permissions.js';
import BigBitfield from 'big-bitfield';

class Permission extends BigBitfield {

	constructor(data = 32) {
		super(data);
	}

	// List of permission bits
	static allPermissions = Object.values(Permissions)
		.filter(v => typeof v === 'number');

	// Convert to a map of bit to metadata and state, for use in templates
	toJSON() {
		return Object.entries(Metadata)
			.reduce((acc, entry) => {
				acc[entry[0]] = {
					state: this.get(entry[0]),
					...entry[1],
				};
				return acc;
			}, {});
	}

	// Update permission based on body and another users permission
	handleBody(body, editorPermission, /* orgOnly */) {
		// const handlingBits = orgOnly ? Permissions._ORG_BITS : Object.keys(Metadata);
		const handlingBits = Object.keys(Metadata);
		for (let bit of handlingBits) {
			// If perm has no "parents" bit list, or current user has at least one of the parent permissions, set each bit based on the form input
			const allowedParent = Metadata[bit].parents == null
				|| editorPermission.hasAny(...Metadata[bit].parents);
			if (allowedParent && !Metadata[bit].block) {
				this.set(parseInt(bit), (body[`permission_bit_${bit}`] != null));
			}
		}
	}

}

export default Permission;
