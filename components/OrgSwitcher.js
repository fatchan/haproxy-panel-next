import React, { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';
import Capabilities from '../lib/capabilities.js';

//TODO: move?
export function shouldShowSwitcher(billingUser, orgs) {
	if (!billingUser) return false;
	const caps = billingUser.billing?.capabilities || [];
	const hasOrgCap = caps.includes(Capabilities.ORGANISATIONS);
	const memberOfOtherOrg = (orgs || []).some(o => o.owner !== billingUser.username);
	return hasOrgCap || memberOfOtherOrg;
}

export default function OrgsSwitcher(props) {
	const router = useRouter();
	const [state, setState] = useState(props);
	const [loading, setLoading] = useState(false);
	const [switching, setSwitching] = useState(false);
	const [error, setError] = useState();
	const { orgs, user, originalUser, currentOrgId, csrf } = state || {};
	const billingUser = originalUser || user;

	useEffect(() => {
		setLoading(true);
		API.getOrgs(setState, setError, router).finally(() => setLoading(false));
	}, []);

	const orgOptions = useMemo(() => {
		return (orgs || []).map(o => ({
			value: o._id,
			label: `${o.owner === originalUser.username ? '🏠 ' : ''}${o.owner || o._id}'s Org`,
			owner: o.owner,
		}));
	}, [state]);

	const handleChange = async selected => {
		if (!selected) { return; }
		setError();
		setSwitching(true);
		await API.switchOrg({ _csrf: csrf, orgId: selected.value }, null, setError, router);
		await API.getOrgs(setState, setError, router);
		setSwitching(false);
		router.reload(); //easiest thing
	};

	const selectedOption = orgOptions.find(o => o.value === currentOrgId)
		|| orgOptions.find(o => o.owner === originalUser.username) //should default to own org when none selected
		|| null;

	if (!shouldShowSwitcher(billingUser, orgs)) {
		return null;
	}

	return (
		<div className='orgs-switcher'>
			<Link className='orgs-switcher-label text-body' href='/organisation'>
				Organisation <i className='bi-arrow-right-short' width='16' height='16' />
			</Link>
			<div>
				<Select
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

