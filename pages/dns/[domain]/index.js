import { useRouter } from 'next/router';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import RecordSetRow from '../../../components/RecordSetRow.js';
import BackButton from '../../../components/BackButton.js';
import ErrorAlert from '../../../components/ErrorAlert.js';
import SearchFilter from '../../../components/SearchFilter.js';
import * as API from '../../../api.js';

const DnsDomainIndexPage = (props) => {

	const router = useRouter();
	const { domain } = router.query;
	const [state, dispatch] = useState({
		...props,
	});
	const [error, setError] = useState();
	const [sortType, setSortType] = useState('name');
	const [sortOrder, setSortOrder] = useState(-1);
	const [filter, setFilter] = useState('');
	const { recordSets, csrf } = state;
	const handleSetSorting = (newSortType) => {
		let sorted;
		const sameType = newSortType === sortType;
		const newSortOrder = sortOrder * (sameType ? -1 : 1);
		if (newSortType === 'name') {
			sorted = recordSets.sort((a, b) => {
				return (Object.keys(a)[0].localeCompare(Object.keys(b)[0]) * newSortOrder);
			});
		} else if (newSortType === 'type') {
			sorted = recordSets.map(recordSet => {
				const k = Object.keys(recordSet)[0];
				let rs = Object.entries(recordSet[k]);
				rs = rs.sort((a, b) => (a[0].localeCompare(b[0]) * newSortOrder));
				recordSet[k] = Object.fromEntries(rs);
				return recordSet;
			});
		}
		setSortOrder(newSortOrder);
		setSortType(newSortType);
		dispatch({ ...state, recordSets: sorted });
	};

	useEffect(() => {
		if (!state.recordSets) {
			API.getDnsDomain(domain, dispatch, setError, router);
		}
	}, [state.recordSets, domain, router]);

	if (recordSets == null) {
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

	const recordSetRows = recordSets.map(recordSet => {
		return Object.entries(recordSet)
			.filter(x => x && JSON.stringify(x).includes(filter))
			.map(e => {
				return Object.entries(e[1])
					.map((record, i) => (
						<RecordSetRow
							csrf={csrf}
							domain={domain}
							key={`${e[0]}_${i}`}
							name={e[0]}
							recordSet={record}
							dispatch={dispatch}
							setError={setError}
							router={router}
						/>
					));
			});
	});

	const sortArrow = sortOrder === 1 ? <i className='bi-caret-down-fill'></i> : <i className='bi-caret-up-fill'></i>;

	return (
		<>

			<Head>
				<title>
					{`${domain} / Records list`}
				</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<h5 className='fw-bold'>
				{domain} / Records list:
			</h5>

			<SearchFilter filter={filter} setFilter={setFilter} />

			{/* Record sets table */}
			<div className='table-responsive round-border'>
				<table className='table text-nowrap'>
					<tbody>

						{/* header row */}
						<tr>
							<th />
							<th role='button' className='user-select-none' onClick={() => handleSetSorting('name')}>
								Name
								{sortType === 'name' && sortArrow}
							</th>
							<th role='button' className='user-select-none' onClick={() => handleSetSorting('type')}>
								Type
								{sortType === 'type' && sortArrow}
							</th>
							<th>
								Content
							</th>
							<th>
								TTL
							</th>
							<th>
								Details
							</th>
						</tr>

						{recordSetRows}

					</tbody>
				</table>
			</div>

			<div className='my-3'>
				<Link href={`/dns/${domain}/new`}>
					<button className='btn btn-sm btn-success'>
						+
					</button>
				</Link>
			</div>

			{/* back to account */}
			<BackButton to='/domains' />

		</>
	);

};

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: res.locals.data };
}

export default DnsDomainIndexPage;
