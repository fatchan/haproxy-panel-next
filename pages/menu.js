import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import MenuLinks from '../components/MenuLinks';
import { useRouter } from 'next/router';
import * as API from '../api.js';
import ErrorAlert from '../components/ErrorAlert.js';

export default function Menu(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	const { user, originalUser } = state || {};

	useEffect(() => {
		API.getAccount(dispatch, setError, router);
	}, []);

	if (!state.user) {
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

	return (<>
		<Head>
			<title>Menu</title>
		</Head>

		<div className='p-3 pt-0 mobile-menu'>
			<MenuLinks user={user} originalUser={originalUser} />
		</div>
	</>);
}
