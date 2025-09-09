import React, { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { useRouter } from 'next/router';
import ErrorAlert from '../components/ErrorAlert.js';
import * as API from '../api.js';

export default function OrgsSwitcher() {
	const router = useRouter();
	const [state, setState] = useState();
	const [loading, setLoading] = useState(false);
	const [switching, setSwitching] = useState(false);
	const [error, setError] = useState();
	const { orgs, originalUser, currentOrgId } = state || {};

	useEffect(() => {
		setLoading(true);
		API.getOrgs(setState, setError, router).finally(() => setLoading(false));
	}, []);

	const options = useMemo(() => {
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
		await API.switchOrg({ orgId: selected.value }, null, setError, router);
		await API.getOrgs(setState, setError, router);
		setSwitching(false);
		router.reload(); //easiest thing
	};

	const selectedOption = options.find(o => o.value === currentOrgId)
		|| options.find(o => o.owner === originalUser.username) //should default to own org when none selected
		|| null;

	return (
		<div className='orgs-switcher'>
			<div style={{ fontSize: 12, marginBottom: 6, color: '#333' }}>Organisation</div>
			<div>
				<Select
					classNamePrefix='select'
					className='basic-multi-select'
					isLoading={loading || switching}
					options={options}
					value={selectedOption}
					onChange={handleChange}
					isSearchable={false}
					placeholder={loading ? 'Loading…' : options.length ? 'Select org' : 'No orgs'} //should never be "no orgs" really
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

