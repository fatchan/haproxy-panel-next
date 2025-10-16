// pages/edit-member.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as API from '../../../../api.js';
import ErrorAlert from '../../../../components/ErrorAlert.js';
import withAuth from '../../../../components/withAuth.js';
import PermissionsForm from '../../../../components/PermissionsForm'; // the form component from earlier
import { useParams } from 'next/navigation.js';

function EditMemberPage(props) {
	const router = useRouter();
	const params = useParams();
	const [state, setState] = useState(props);
	const [error, setError] = useState();
	const [loadingMember, setLoadingMember] = useState(false);
	const { memberUsername } = params;
	const { member, csrf, orgs, currentOrgId, originalUser } = state || {};
	const currentOrg = (orgs || []).find(o => o._id === currentOrgId)
		|| (orgs || []).find(o => o.owner === originalUser.username) //should default to own org when none selected
		|| null;

	useEffect(() => {
		if (memberUsername === member?.username) {
			return;
		}
		async function fetchMember() {
			setLoadingMember(true);
			await API.getOrganisationMember({ memberUsername }, setState, setError, router);
			setLoadingMember(false);
		}
		fetchMember();
	}, [memberUsername]);

	async function handleSubmit(e) {
		e.preventDefault();
		setError(null);
		const formObj = Object.fromEntries(new FormData(e.target).entries());
		await API.updateOrganisationMember({ _csrf: csrf, memberUsername, orgId: currentOrg._id, ...formObj }, setState, setError, router);
		await API.getOrganisationMember({ memberUsername }, setState, setError, router);
	}

	return (
		<>
			<Head>
				<title>Edit Org Member</title>
			</Head>

			<h5 className='fw-bold'>Edit Org Member</h5>

			{error && <ErrorAlert error={error} />}

			<div className='mb-3'>
				<strong>Editing Org Member:</strong> {memberUsername}
			</div>

			{(!member || loadingMember)
				? (
					<div className='text-center mb-4'>
						<div className='spinner-border mt-5' role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				)
				: (
					<form onSubmit={handleSubmit}>
						<PermissionsForm
							// jsonPermissions={member.permissions}
							permissions={member.permissions}
						/>

						<div className='mt-3'>
							<button type='submit' className='btn btn-primary'>Save</button>
						</div>
					</form>
				)}
		</>
	);
}

export async function getServerSideProps({ res }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(EditMemberPage);

