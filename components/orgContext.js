import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import Permission from '../lib/permissions/permission.js';
// import { Permissions } from '../lib/permissions/permissions.js';

const OrgContext = createContext(null);

export function OrgProvider({ children, initialState = {} }) {
	const router = useRouter();
	const [state, setState] = useState(initialState);
	const [loading, setLoading] = useState(false);
	const { orgs, originalUser, currentOrgId } = state || {};

	const getOrganisations = useCallback(async () => {
		setLoading(true);
		try {
			await API.getOrganisations(setState, null, router);
		} finally {
			setLoading(false);
		}
	}, [router]);

	useEffect(() => {
		getOrganisations();
	}, []);

	const currentOrg = (orgs || []).find(o => o._id === currentOrgId)
    || (orgs || []).find(o => o.owner === originalUser.username) //should default to own org when none selected
    || null;

	const viewPerms = new Permission(currentOrg?.members[originalUser?.username]?.permissions?.toString('base64'));
	viewPerms.applyInheritance();

	const value = {
		state,
		loading,
		currentOrg,
		viewPerms,
		getOrganisations,
	};

	return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgContext() {
	const ctx = useContext(OrgContext);
	if (!ctx) {throw new Error('useOrgContext must be used within an OrgProvider');}
	return ctx;
}
