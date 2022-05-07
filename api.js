import NProgress from 'nprogress';

export default async function ApiCall(route, method, body, stateCallback, finishProgress) {
	try {
		const options = {
			method,
		};
		if (body != null) {
			options.body = body;
			options.headers = { 'Content-Type': 'application/json' };
		}
		NProgress.start();
		let response = await fetch(route, options)
			.then(res => res.json());
		stateCallback && stateCallback(response);
	} catch(e) {
		console.error(e);
	} finally {
		if (finishProgress != null) {
			NProgress.set(finishProgress);
		} else {
			NProgress.done(true);
		}
		return null;
	}
}
