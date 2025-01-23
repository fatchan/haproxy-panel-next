import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import SearchFilter from '../components/SearchFilter.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';

export default function Streams(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState('');

	useEffect(() => {
		if (!state.user || !state.user.domains || state.streams == null) {
			API.getStreams(dispatch, setError, router);
		}
	}, []);

	if (!state.user || state.user.domains == null || state.streams == null) {
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

	const { csrf, streamKeys, streams } = state;

	async function addStream(e) {
		e.preventDefault();
		setError(null);
		await API.addStream({ _csrf: csrf, appName: e.target.appName.value }, dispatch, setError, router);
		await API.getStreams(dispatch, setError, router);
		e.target.reset();
	}

	async function deleteStream(csrf, appName) {
		setError(null);
		await API.deleteStream({ _csrf: csrf, appName }, dispatch, setError, router);
		await API.getStreams(dispatch, setError, router);
	}

	const streamsTable = streams
		// .sort((a, b) => a.localeCompare(b))
		.filter(s => (!filter || filter.length === 0) || (s && s.includes(filter)))
		.map(s => (
			<tr key={`stream_${s}`} className='align-middle'>
				<td className='text-left' style={{ width: 0 }}>
					<a className='btn btn-sm btn-danger' onClick={() => deleteStream(csrf, s)}>
						<i className='bi-trash-fill pe-none' width='16' height='16' />
					</a>
				</td>
				<td>
					{s.substring(s.indexOf(':')+1)}
				</td>
			</tr>
		));

	const streamKeysTable = streamKeys
		// .sort((a, b) => a.localeCompare(b))
		.filter(s => (!filter || filter.length === 0) || (s.appName && s.appName.includes(filter)))
		.map(s => (
			<tr key={`stream_${s.appName}`} className='align-middle'>
				<td className='text-left' style={{ width: 0 }}>
					<a className='btn btn-sm btn-danger' onClick={() => deleteStream(csrf, s.appName)}>
						<i className='bi-trash-fill pe-none' width='16' height='16' />
					</a>
				</td>
				<td>
					{s.appName}
				</td>
				<td>
					{s.streamKey}
				</td>
			</tr>
		));

	return (
		<>

			<Head>
				<title>Stream Keys</title>
			</Head>

			<SearchFilter filter={filter} setFilter={setFilter} />

			<h5 className='fw-bold'>
				Live Streams:
			</h5>

			{/* Streams table */}
			<div className='table-responsive round-border mb-2'>
				<table className='table text-nowrap'>
					<tbody>

						<tr className='align-middle'>
							<th />
							<th>
								Name
							</th>
						</tr>

						{streamsTable}

					</tbody>
				</table>
			</div>

			<h5 className='fw-bold'>
				Stream Keys:
			</h5>

			{/* Streams table */}
			<div className='table-responsive round-border'>
				<table className='table text-nowrap'>
					<tbody>

						<tr className='align-middle'>
							<th />
							<th>
								Name
							</th>
							<th>
								Stream Key
							</th>
						</tr>

						{streamKeysTable}

						{/* Add new stream form */}
						<tr className='align-middle'>
							<td className='col-1 text-center' colSpan='4'>
								<form className='d-flex' onSubmit={addStream} action='/forms/stream/add' method='post'>
									<input type='hidden' name='_csrf' value={csrf} />
									<button className='btn btn-sm btn-success' type='submit'>
										<i className='bi-plus-lg pe-none' width='16' height='16' />
									</button>
									<input className='form-control ms-3' type='text' name='appName' placeholder='key name' required />
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
	return { props: JSON.parse(JSON.stringify(res.locals.data)) };
}
