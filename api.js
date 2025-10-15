import NProgress from 'nprogress';

export async function getAccount(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/account.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function getAccounts(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/accounts.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function deleteAccount(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/forms/account/${body.accountId}`, 'DELETE', body, dispatch, errorCallback, router, 1, customHeaders);
}
export async function getCsrf(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/csrf', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function getIncidents(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/incidents.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function getOnboarding(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/onboarding.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function getBilling(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/billing.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function updateOnboarding(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/onboarding', 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}
export async function login(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/login', 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}
export async function requestchangepassword(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/requestchangepassword', 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}
export async function changepassword(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/changepassword', 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}
export async function verifyemail(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/verifyemail', 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}
export async function register(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/register', 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}
export async function getDownIps(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/down.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function setDownIps(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/down', 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function createPaymentRequest(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/billing/payment_request', 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}

export async function getOrganisations(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/organisations.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function switchOrganisation(body, dispatch, errorCallback, router, customHeaders = {}, progress) {
	return ApiCall(`/forms/organisation/${body.orgId}/switch`, 'POST', body, dispatch, errorCallback, router, progress || 0.5, customHeaders);
}
export async function getOrganisationMember(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/organisation/member/${body.memberUsername}.json`, 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function addOrganisationMember(body, dispatch, errorCallback, router, customHeaders = {}, progress) {
	return ApiCall(`/forms/organisation/${body.orgId}/members`, 'POST', body, dispatch, errorCallback, router, progress || 0.5, customHeaders);
}
export async function removeOrganisationMember(body, dispatch, errorCallback, router, customHeaders = {}, progress) {
	return ApiCall(`/forms/organisation/${body.orgId}/member/${body.memberUsername}`, 'DELETE', body, dispatch, errorCallback, router, progress || 0.5, customHeaders);
}

export async function getDomains(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/domains.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function addDomain(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/domain/add', 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function deleteDomain(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/domain/delete', 'DELETE', body, dispatch, errorCallback, router, 0.5, customHeaders);
}

export async function getStreams(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/streams.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function addStream(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/stream', 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function toggleStream(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/forms/stream/${body.id}/toggle`, 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function concludeStream(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/forms/stream/${body.id}/conclude`, 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function restartStream(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/forms/stream/${body.id}/restart`, 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function deleteStream(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/forms/stream/${body.id}`, 'DELETE', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function addStreamWebhook(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/stream/webhook', 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function deleteStreamWebhook(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/forms/stream/webhook/${body.id}`, 'DELETE', body, dispatch, errorCallback, router, 0.5, customHeaders);
}

export async function getApiKeys(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/apikeys.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function addApiKey(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/apikey/add', 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function deleteApiKey(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/apikey/delete', 'DELETE', body, dispatch, errorCallback, router, 0.5, customHeaders);
}

export async function getDnsDomain(domain, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/dns/${domain}.json`, 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function getDnsRecords(domain, zone, type, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/dns/${domain}/${zone}/${type}.json`, 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function addUpdateDnsRecord(domain, zone, type, body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/forms/dns/${domain}/${zone}/${type}`, 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}
export async function deleteDnsRecord(domain, zone, type, body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/forms/dns/${domain}/${zone}/${type}/delete`, 'DELETE', body, dispatch, errorCallback, router, 1, customHeaders);
}

export async function getCerts(dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/certs.json', 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function addCert(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/cert/add', 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function deleteCert(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/cert/delete', 'DELETE', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function uploadCert(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/cert/upload', 'DELETE', body, dispatch, errorCallback, router, 0.5, customHeaders);
}
export async function verifyCSR(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/csr/verify', 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}

export async function getMap(mapName, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall(`/map/${mapName}.json`, 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}
export async function addToMap(mapName, body, dispatch, errorCallback, router, customHeaders = {}, progress) {
	return ApiCall(`/forms/map/${mapName}/add`, 'POST', body, dispatch, errorCallback, router, progress || 0.5, customHeaders);
}
export async function deleteFromMap(mapName, body, dispatch, errorCallback, router, customHeaders = {}, progress) {
	return ApiCall(`/forms/map/${mapName}/delete`, 'DELETE', body, dispatch, errorCallback, router, progress || 0.5, customHeaders);
}

export async function getStats(body, dispatch, errorCallback, router, customHeaders = {}) {
	const queryString = new URLSearchParams(body);
	return ApiCall(`/stats.json?${queryString.toString()}`, 'GET', null, dispatch, errorCallback, router, 1, customHeaders);
}

export async function globalToggle(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/global/toggle', 'POST', body, dispatch, errorCallback, router, 0.5, customHeaders);
}

export async function cachePurge(body, dispatch, errorCallback, router, customHeaders = {}) {
	return ApiCall('/forms/cache/purge', 'POST', body, dispatch, errorCallback, router, 1, customHeaders);
}

function buildOptions(route, method, body, customHeaders) {

	// Convert method uppercase
	method = method.toUpperCase();
	const options = {
		redirect: 'manual',
		method,
		headers: {
			'Content-Type': 'application/json',
			...customHeaders,
		}
	};
	if (body != null) {
		options.body = JSON.stringify(body);
	}
	//TODO: for GETs, use "body" with URLSearchParams and append as url query
	return options;
}

async function ApiCallTest(route, method = 'get', body, customHeaders = {}) {
	const requestOptions = buildOptions(route, method, body, customHeaders);
	const res = await fetch(`http://localhost:3000${route}`, requestOptions);
	const ct = res?.headers?.get('content-type') || '';
	if (ct.startsWith('application/json')) {
		return res.json();
	}
	return res.text();
}

export async function ApiCall(route, method = 'get', body, dispatch, errorCallback, router, finishProgress = 1, customHeaders = {}) {

	if (process.env.TEST) {
		return ApiCallTest(route, method, body, customHeaders);
	}

	// Start progress bar
	if (finishProgress !== false) {
		NProgress.start();
	}

	// Build request options for fetch
	const requestOptions = buildOptions(route, method, body);

	// Make request, catch errors, and finally{} to always end progress bar
	let response, error;
	try {
		response = await fetch(route, requestOptions);
	} catch (e) {
		error = e;
		console.error(e);
	} finally {
		if (finishProgress != null) {
			NProgress.set(finishProgress);
		} else if (finishProgress !== false) {
			NProgress.done(true);
		}
	}

	if (!response) {
		errorCallback(error?.message || 'An error occurred');
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
			if (!router || router.asPath === response.redirect) {
				return;
			}
			return router.push(response.redirect, null, { scroll: false });
		} else if (response.error) {
			errorCallback(response.error);
			return;
		}
		dispatch && dispatch(response);
		NProgress.done(true);
		return response;
	} else {
		errorCallback('An error occurred');
		NProgress.done(true);
	}

}
