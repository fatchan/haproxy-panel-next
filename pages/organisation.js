import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as API from '../api.js';
import ErrorAlert from '../components/ErrorAlert.js';
import withAuth from '../components/withAuth.js';

function OrganisationPage(props) {
	const router = useRouter();
	const [state, setState] = useState(props);
	const [error, setError] = useState();
	const [adding, setAdding] = useState(false);

	const { originalUser, orgs, currentOrgId, csrf } = state || {};
	const currentOrg = (orgs || []).find(o => o._id === currentOrgId)
		|| (orgs || []).find(o => o.owner === originalUser.username) //should default to own org when none selected
		|| null;

	const isOwner = currentOrg && originalUser && currentOrg.owner === originalUser.username;

	useEffect(() => {
		API.getOrgs(setState, setError, router);
	}, []);

	if (!state || !state.originalUser) {
		return (
			<div className='d-flex flex-column'>
				{error && <ErrorAlert error={error} />}
				<div className='text-center mb-4'>
					<div className='spinner-border mt-5' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	async function onAddMember(e) {
		e.preventDefault();
		setAdding(true);
		await API.addOrgMember({ _csrf: csrf, orgId: currentOrg._id, memberUsername: e.target.member?.value }, setState, setError, router);
		await API.getOrgs(setState, setError, router);
		setAdding(false);
	};

	async function onRemoveMember(memberUsername) {
		if (!confirm(`Remove member "${memberUsername}" from this organisation?`)) {
			return;
		}
		await API.removeOrgMember({ _csrf: csrf, orgId: currentOrg._id, memberUsername }, setState, setError, router);
		await API.getOrgs(setState, setError, router);
	}

	return (
		<>
			<Head>
				<title>Organisation</title>
			</Head>

			<h5 className='fw-bold'>
				Organisation:
			</h5>

			{error && <ErrorAlert error={error} />}

			{!currentOrg ? (
				<div className='d-flex flex-column'>
					{error && <ErrorAlert error={error} />}
					<div className='text-center mb-4'>
						<div className='spinner-border mt-5' role='status'>
							<span className='visually-hidden'>Loading...</span>
						</div>
					</div>
				</div>
			) : (
				<>
					<div className='mb-3'>
						<strong>Name:</strong> {currentOrg.owner}&apos;s Org
					</div>
					<div className='mb-3'>
						<strong>Owner:</strong> {currentOrg.owner}
					</div>

					<hr />

					{/* Members table */}
					<div className='table-responsive round-border mb-2'>
						<table className='table text-nowrap'>
							<tbody>
								<tr className='align-middle'>
									<th />
									<th>Username</th>
									<th>Added Date</th>
									<th>Role</th>
								</tr>

								{Object.entries(currentOrg.members || {}).map(([name, data], mi) => (
									<tr className="align-middle" key={mi}>
										<td className="col-1 text-center">
											{isOwner && (
												<button
													disabled={name === currentOrg.owner}
													className={`btn btn-sm ${name !== currentOrg.owner ? 'btn-danger' : 'btn-secondary'}`}
													title="Remove member"
													onClick={() => onRemoveMember(name)}
												>
													<i className="bi-trash-fill pe-none" width="16" height="16" />
												</button>
											)}
										</td>
										<td>{name}</td>
										<td>
											<span suppressHydrationWarning>
												{data?.addedDate
													? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
														.format(new Date(data.addedDate))
													: ''}
											</span>
										</td>
										<td>{name === currentOrg.owner ? 'Owner' : 'Member'}</td>
									</tr>
								))}

								{(!currentOrg.members || currentOrg.members.length === 0) && (
									<tr className='align-middle'>
										<td colSpan='4'>No members</td>
									</tr>
								)}

								{isOwner && (
									<tr>
										<td colSpan='4'>
											<form className='d-flex' onSubmit={onAddMember}>
												<input
													className='form-control w-100'
													name='member'
													type='text'
													placeholder='username'
													disabled={adding}
													required
												/>
												<button className='btn btn-sm btn-success ms-3' type='submit' disabled={adding}>
													<i className='bi-plus-lg pe-none' />
												</button>
											</form>
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</>
			)}
		</>
	);
}

export async function getServerSideProps({ res }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(OrganisationPage);
