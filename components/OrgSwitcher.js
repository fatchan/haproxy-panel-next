import React, { useMemo, useState } from 'react';
import Select from 'react-select';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ErrorAlert from '../components/ErrorAlert.js';
import Capabilities from '../lib/capabilities.js';
import { useOrgContext } from '../components/orgContext.js';
import * as API from '../api.js';

export function shouldShowSwitcher(billingUser, orgs) {
	if (!billingUser) { return false; }
	const caps = billingUser.billing?.capabilities || [];
	const hasOrgCap = caps.includes(Capabilities.ORGANISATIONS);
	const memberOfOtherOrg = (orgs || []).some(o => o.owner !== billingUser.username);
	return hasOrgCap || memberOfOtherOrg;
}

export default function OrgsSwitcher(props) {
	const router = useRouter();
	const { state, loading } = useOrgContext(props);
	const [switching, setSwitching] = useState(false);
	const [error, setError] = useState();
	const { orgs, user, originalUser, currentOrgId, csrf } = state || {};
	const billingUser = originalUser || user;

	const orgOptions = useMemo(() => {
		return (orgs || []).map(o => ({
			value: o._id,
			label: `${o.owner === originalUser.username ? '🏠 ' : ''}${o.owner || o._id}'s Org`,
			owner: o.owner,
		}));
	}, [orgs, originalUser]);

	const handleChange = async selected => {
		if (!selected) {return;}
		setError(undefined);
		setSwitching(true);
		try {
			await API.switchOrganisation({ _csrf: csrf, orgId: selected.value }, null, setError, router);
			router.reload();
		} finally {
			setSwitching(false);
		}
	};

	const selectedOption = orgOptions.find(o => o.value === currentOrgId)
		|| orgOptions.find(o => o.owner === originalUser.username) //should default to own org when none selected
		|| null;

	if (!shouldShowSwitcher(billingUser, orgs)) {
		return null;
	}

	return (
		<div className='orgs-switcher'>
			<Link className='orgs-switcher-label text-body-secondary' href='/organisation'>
				Organisation <i className='bi-arrow-right-short' width='16' height='16' />
			</Link>
			<div>
				<Select
					instanceId='org-switcher'
					suppressHydrationWarning={true}
					classNamePrefix='select'
					className='basic-multi-select'
					isLoading={loading || switching}
					options={orgOptions}
					value={selectedOption}
					onChange={handleChange}
					isSearchable={false}
					placeholder={loading ? 'Loading…' : orgOptions.length ? 'Select org' : 'No orgs'} //should never be "no orgs" really
					styles={{
						control: initial => ({ ...initial, minHeight: 34 }),
						menu: initial => ({ ...initial, zIndex: 2000 }),
					}}
				/>
			</div>
			{error && <ErrorAlert error={error} />}
		</div>
	);
}

