// pages/edit-member.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as API from '../../../../api.js';
import ErrorAlert from '../../../../components/ErrorAlert.js';
import withAuth from '../../../../components/withAuth.js';
import PermissionsForm from '../../../../components/PermissionsForm'; // the form component from earlier
import { useParams } from 'next/navigation.js';
import { useOrgContext } from '../../../../components/orgContext.js';
import { Permissions } from '../../../../lib/permissions/permissions.js';

function EditMemberPage(props) {
	const router = useRouter();
	const params = useParams();
	const [state, setState] = useState(props);
	const [error, setError] = useState();
	const [loadingMember, setLoadingMember] = useState(false);
	const { viewPerms, currentOrg } = useOrgContext();
	const { memberUsername } = params;
	const { member, csrf, originalUser } = state || {};

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

	const editing = viewPerms.get(Permissions.MANAGE_ORG);
	const title = `${editing ? 'Edit' : 'View'} Org Member`;

	return (
		<>
			<Head>
				<title>{title}</title>
			</Head>

			<h5 className='fw-bold'>{title}</h5>

			{error && <ErrorAlert error={error} />}

			<div className='mb-3'>
				<strong>Username:</strong> {memberUsername}
			</div>

			{(!member || loadingMember || !currentOrg)
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
							currentPermissions={currentOrg.members[originalUser.username].permissions}
							editingPermissions={member.permissions}
						/>

						{editing && <div className='mt-3'>
							<button type='submit' className='btn btn-primary'>Save</button>
						</div>}
					</form>
				)}
		</>
	);
}

export async function getServerSideProps({ res }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(EditMemberPage);

