import NProgress from 'nprogress';

export default async function ApiCall(route, method, body, stateCallback, finishProgress, router) {
	try {
		const options = {
//			redirect: "manual",
			method,
		};
		if (body != null) {
			options.body = body;
			options.headers = { 'Content-Type': 'application/json' };
		}
		NProgress.start();
		let response = await fetch(route, options);
//		if (response && response.ok) {
			response = await response.json();
			console.log(response);
			stateCallback && stateCallback(response);
//		} else {
//			//TODO: handle bad form submissions by including "error" prop into callback
//			router.push('/login');
//		}
	} catch(e) {
		console.error(e);
		//TODO: handle bad form submissions by including "error" prop into callback
//		router.push('/login');
	} finally {
		if (finishProgress != null) {
			NProgress.set(finishProgress);
		} else {
			NProgress.done(true);
		}
		return null;
	}
}
