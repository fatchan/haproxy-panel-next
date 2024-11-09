import NProgress from 'nprogress';

// Account
export async function getAccount(dispatch, errorCallback, router) {
	return ApiCall('/account.json', 'GET', null, dispatch, errorCallback, router);
}
export async function getOnboarding(dispatch, errorCallback, router) {
	return ApiCall('/onboarding.json', 'GET', null, dispatch, errorCallback, router);
}
export async function getBilling(dispatch, errorCallback, router) {
	return ApiCall('/billing.json', 'GET', null, dispatch, errorCallback, router);
}
export async function updateOnboarding(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/onboarding', 'POST', body, dispatch, errorCallback, router);
}
export async function login(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/login', 'POST', body, dispatch, errorCallback, router);
}
export async function requestchangepassword(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/requestchangepassword', 'POST', body, dispatch, errorCallback, router);
}
export async function changepassword(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/changepassword', 'POST', body, dispatch, errorCallback, router);
}
export async function verifyemail(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/verifyemail', 'POST', body, dispatch, errorCallback, router);
}
export async function register(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/register', 'POST', body, dispatch, errorCallback, router);
}
export async function getDownIps(dispatch, errorCallback, router) {
	return ApiCall('/down.json', 'GET', null, dispatch, errorCallback, router);
}
export async function setDownIps(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/down', 'POST', body, dispatch, errorCallback, router, 0.5);
}
export async function createPaymentRequest(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/billing/payment_request', 'POST', body, dispatch, errorCallback, router);
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

// Dns
export async function getDnsDomain(domain, dispatch, errorCallback, router) {
	return ApiCall(`/dns/${domain}.json`, 'GET', null, dispatch, errorCallback, router);
}
export async function getDnsRecords(domain, zone, type, dispatch, errorCallback, router) {
	return ApiCall(`/dns/${domain}/${zone}/${type}.json`, 'GET', null, dispatch, errorCallback, router);
}
export async function addUpdateDnsRecord(domain, zone, type, body, dispatch, errorCallback, router) {
	return ApiCall(`/forms/dns/${domain}/${zone}/${type}`, 'POST', body, dispatch, errorCallback, router);
}
export async function deleteDnsRecord(domain, zone, type, body, dispatch, errorCallback, router) {
	return ApiCall(`/forms/dns/${domain}/${zone}/${type}/delete`, 'POST', body, dispatch, errorCallback, router);
}

// Certs
export async function getCerts(dispatch, errorCallback, router) {
	return ApiCall('/certs.json', 'GET', null, dispatch, errorCallback, router);
}
export async function addCert(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/cert/add', 'POST', body, dispatch, errorCallback, router, 0.5);
}
export async function deleteCert(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/cert/delete', 'POST', body, dispatch, errorCallback, router, 0.5);
}
export async function uploadCert(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/cert/upload', 'POST', body, dispatch, errorCallback, router, 0.5);
}
export async function verifyCSR(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/csr/verify', 'POST', body, dispatch, errorCallback, router, 0.5);
}

// Maps
export async function getMap(mapName, dispatch, errorCallback, router) {
	return ApiCall(`/map/${mapName}.json`, 'GET', null, dispatch, errorCallback, router);
}
export async function addToMap(mapName, body, dispatch, errorCallback, router, progress) {
	return ApiCall(`/forms/map/${mapName}/add`, 'POST', body, dispatch, errorCallback, router, progress || 0.5);
}
export async function deleteFromMap(mapName, body, dispatch, errorCallback, router, progress) {
	return ApiCall(`/forms/map/${mapName}/delete`, 'POST', body, dispatch, errorCallback, router, progress || 0.5);
}

// Stats
export async function getStats(body, dispatch, errorCallback, router) {
	const queryString = new URLSearchParams(body);
	return ApiCall(`/stats.json?${queryString.toString()}`, 'GET', null, dispatch, errorCallback, router);
}

// Global toggle
export async function globalToggle(body, dispatch, errorCallback, router) {
	return ApiCall('/forms/global/toggle', 'POST', body, dispatch, errorCallback, router, 0.5);
}

function buildOptions(route, method, body) {

	// Convert method uppercase
	method = method.toUpperCase();
	const options = {
		redirect: 'manual',
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
	if (finishProgress !== false) {
		NProgress.start();
	}

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
		} else if (finishProgress !== false) {
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
			if (router.asPath === response.redirect) {
				return;
			}
			return router.push(response.redirect, null, { scroll: false });
		} else if (response.error) {
			errorCallback(response.error);
			return;
		}
		dispatch(response);
		return response;
	} else {
		errorCallback('An error occurred');
		NProgress.done(true);
	}

}
