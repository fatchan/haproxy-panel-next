import NProgress from 'nprogress';

// Account
export async function getAccount(dispatch, errorCallback, router) {
	return ApiCall('/account.json', 'GET', null, dispatch, errorCallback, router);
}
export async function login(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/login', 'POST', body, dispatch, errorCallback, router);
}
export async function register(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/register', 'POST', body, dispatch, errorCallback, router);
}

// Clusters
export async function getClusters(dispatch, errorCallback, router) {
	return ApiCall('/clusters.json', 'GET', null, dispatch, errorCallback, router);
}
export async function addCluster(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/cluster/add', 'POST', body, dispatch, errorCallback, router, 0.5);
}
export async function deleteCluster(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/cluster/delete', 'POST', body, dispatch, errorCallback, router, 0.5);
}
export async function changeCluster(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/cluster', 'POST', body, dispatch, errorCallback, router, 0.5);
}

// Domains
export async function getDomains(dispatch, errorCallback, router) {
	return ApiCall('/domains.json', 'GET', null, dispatch, errorCallback, router);
}
export async function addDomain(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/domain/add', 'POST', body, dispatch, errorCallback, router, 0.5);
}
export async function deleteDomain(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/domain/delete', 'POST', body, dispatch, errorCallback, router, 0.5);
}

// Maps
export async function getMap(mapName, dispatch, errorCallback, router) {
	return ApiCall(`/map/${mapName}.json`, 'GET', null, dispatch, errorCallback, router);
}
export async function addToMap(mapName, body, dispatch, errorCallback, router) {
	return ApiCall(`/forms/map/${mapName}/add`, 'POST', body, dispatch, errorCallback, router, 0.5);
}
export async function deleteFromMap(mapName, body, dispatch, errorCallback, router) {
	return ApiCall(`/forms/map/${mapName}/delete`, 'POST', body, dispatch, errorCallback, router, 0.5);
}

// Global toggle
export async function globalToggle(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/global/toggle', 'POST', body, dispatch, errorCallback, router, 0.5);
}


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
		options.body = JSON.stringify(body);
	}
	//TODO: for GETs, use "body" with URLSearchParams and append as url query
	return options;
}

export async function ApiCall(route, method='get', body, dispatch, errorCallback, router, finishProgress=1) {

	// Start progress bar
	NProgress.start();

	// Build request options for fetch
	const requestOptions = buildOptions(route, method, body);

	// Make request, catch errors, and finally{} to always end progress bar
	let response;
	try {
		errorCallback(null);
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
		errorCallback('An error occurred');
		NProgress.done(true);
		return;
	}

	// Process request response
	const contentType = response.headers.get('Content-type');
	if (!contentType) {
		errorCallback('An error occurred');
		NProgress.done(true);
		return;
	}
	if (contentType.startsWith('application/json;')) {
		response = await response.json();
		if (response.redirect) {
			return router.push(response.redirect, null, { scroll: false });
		} else if (response.error) {
			errorCallback(response.error);
			return;
		}
		dispatch(response);
	} else {
		errorCallback('An error occurred');
	}

}
