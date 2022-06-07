import NProgress from 'nprogress';

function buildOptions(route, method, body) {

	// Convert method uppercase
	method = method.toUpperCase();
	const options = {
		redirect: "manual",
		method,
		headers: {
			'Content-Type': 'application/json',
		}
	};
	if (body != null) {
		options.body = body;
	}
	return options;
}

export default async function ApiCall(route, method='get', body, dispatch, finishProgress, router) {

	// Start progress bar
	NProgress.start();	

	// Build request options for fetch
	const requestOptions = buildOptions(route, method, body);

	// Make request, catch errors, and finally{} to always end progress bar
	let response;
	try {
		response = await fetch(route, requestOptions);
	} catch(e) {
		console.error(e);
	} finally {
		if (finishProgress != null) {
			NProgress.set(finishProgress);
		} else {
			NProgress.done(true);
		}
	}

	if (!response) {
		dispatch && dispatch({ type: 'error', payload: 'An error occurred' });
		return;
	}

	// Process request response
	const contentType = response.headers.get('Content-type');
	if (contentType.startsWith('application/json;')) {
		response = await response.json();
		if (response.redirect) {
			return router.push(response.redirect, null, { scroll: false });
		} else if (response.error) {
			dispatch && dispatch({ type: 'error', payload: response.error });
			return;
		}
		dispatch && dispatch({ type: 'state', payload: response });
	} else {
		dispatch && dispatch({ type: 'error', payload: 'An error occurred' });
	}

}

export async function getAccount(dispatch, finishProgress, router) {
	return ApiCall('/account.json', 'GET', null, dispatch, finishProgress, router)
}
