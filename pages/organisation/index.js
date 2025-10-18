import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as API from '../../api.js';
import ErrorAlert from '../../components/ErrorAlert.js';
import withAuth from '../../components/withAuth.js';
import { Permissions } from '../../lib/permissions/permissions.js';
import { useOrgContext } from '../../components/orgContext.js';

function OrganisationPage(props) {
	const router = useRouter();
	const [state, setState] = useState(props);
	const [error, setError] = useState();
	const [adding, setAdding] = useState(false);
	const { currentOrg, viewPerms, getOrganisations } = useOrgContext();
	const { csrf, originalUser } = state || {};

	useEffect(() => {
		API.getOrganisations(setState, setError, router);
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
		setError();
		setAdding(true);
		await API.addOrganisationMember({ _csrf: csrf, orgId: currentOrg._id, memberUsername: e.target.member?.value }, null, setError, router);
		await getOrganisations();
		setAdding(false);
	};

	async function onRemoveMember(memberUsername) {
		if (!confirm(`Remove member "${memberUsername}" from this organisation?`)) {
			return;
		}
		setError();
		await API.removeOrganisationMember({ _csrf: csrf, orgId: currentOrg._id, memberUsername }, null, setError, router);
		await getOrganisations();
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
									<tr className='align-middle' key={mi}>
										<td className='col-1 text-center'>
											{(viewPerms.get(Permissions.MANAGE_ORG) || name === originalUser.username) && <>
												{viewPerms.get(Permissions.MANAGE_ORG) && <button
													disabled={name === currentOrg.owner}
													className={`btn btn-sm ${name !== currentOrg.owner ? 'btn-danger' : 'btn-secondary'}`}
													title='Remove member'
													onClick={() => onRemoveMember(name)}
												>
													<i className='bi-trash-fill pe-none' width='16' height='16' />
												</button>}
												<Link aria-disabled={name === currentOrg.owner} href={`/organisation/member/${name}/edit`} passHref className={`ms-2 btn btn-sm ${name !== currentOrg.owner ? 'btn-primary' : 'btn-secondary'}`}>
													<i className={`bi-${!viewPerms.get(Permissions.MANAGE_ORG) || name === originalUser.username ? 'eye' : 'pencil'} pe-none`} width='16' height='16' />
												</Link>
											</>}
										</td>
										<td>{name}</td>
										<td>
											<span suppressHydrationWarning={true}>
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

								{viewPerms.get(Permissions.MANAGE_ORG) && (
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
			)
			}
		</>
	);
}

export async function getServerSideProps({ res }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(OrganisationPage);
