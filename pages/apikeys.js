import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import SearchFilter from '../components/SearchFilter.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import withAuth from '../components/withAuth.js';

function ApiKeys(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState('');
	const [newKey, setNewKey] = useState(null);

	useEffect(() => {
		if (!state.user || !state.user.domains || state.apiKeys == null) {
			API.getApiKeys(dispatch, setError, router);
		}
	}, []);

	if (!state.user || state.user.domains == null || state.apiKeys == null) {
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

	const { csrf, apiKeys } = state;

	async function addApiKey(e) {
		e.preventDefault();
		setError(null);
		await API.addApiKey({ _csrf: csrf, label: e.target.label.value }, (res) => {
			setNewKey(res.key);
		}, setError, router);
		await API.getApiKeys(dispatch, setError, router);
		e.target.reset();
	}

	async function deleteApiKey(csrf, id) {
		setError(null);
		await API.deleteApiKey({ _csrf: csrf, keyId: id }, dispatch, setError, router);
		await API.getApiKeys(dispatch, setError, router);
	}

	const apiKeysTable = apiKeys
		.filter(a => (!filter || filter.length === 0) || (a.label && a.label.includes(filter)))
		.map(s => (
			<tr key={`apikey_${s._id}`} className='align-middle'>
				<td className='text-left' style={{ width: 0 }}>
					<a className='btn btn-sm btn-danger' onClick={() => deleteApiKey(csrf, s._id)}>
						<i className='bi-trash-fill pe-none' width='16' height='16' />
					</a>
				</td>
				<td>
					{s._id}
				</td>
				<td suppressHydrationWarning={true}>
					{new Date(s.dateCreated).toLocaleString()}
				</td>
				<td>
					{s.label}
				</td>
			</tr>
		));

	return (
		<>

			{newKey && <div className='modal show d-block' tabIndex='-1' role='dialog' style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
				<div className='modal-dialog custom-offset' role='document'>
					<div className='modal-content'>
						<div className='modal-header'>
							<h5 className='modal-title'>New API Key</h5>
							<button
								type='button'
								className='btn-close'
								onClick={() => closeModal()}
							></button>
						</div>
						<div className='modal-body'>
							<p>Here is your new API Key: <code>{newKey}</code>.</p>
							<p>This code will only be shown once for security reasons. Ensure you have a copy before closing this modal.</p>
						</div>
						<div className='modal-footer'>
							<button
								type='button'
								className='btn btn-sm btn-secondary'
								onClick={() => setNewKey()}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>}


			<Head>
				<title>API Keys</title>
			</Head>

			<SearchFilter filter={filter} setFilter={setFilter} />

			<h5 className='fw-bold'>
				API Keys:
			</h5>

			{/* Api keys table */}
			<div className='table-responsive round-border mb-2'>
				<table className='table text-nowrap'>
					<tbody>

						<tr className='align-middle'>
							<th />
							<th>
								ID
							</th>
							<th>
								Date Created
							</th>
							<th>
								Label
							</th>
						</tr>
						{apiKeysTable}
						<tr className='align-middle'>
							<td className='col-1 text-center' colSpan='4'>
								<form className='d-flex' onSubmit={addApiKey} action='/forms/apikey/add' method='post'>
									<input type='hidden' name='_csrf' value={csrf} />
									<button className='btn btn-sm btn-success' type='submit'>
										<i className='bi-plus-lg pe-none' width='16' height='16' />
									</button>
									<input className='form-control ms-3' type='text' name='label' placeholder='label' required />
								</form>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* back to account */}
			<BackButton to='/dashboard' />

		</>
	);

}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(ApiKeys);
