import OpenAPIClientAxios from 'openapi-client-axios';
import fetch from 'node-fetch';
import FormData from 'form-data';

export const getHaproxy = (server, app, clusterUrls, agent, definition) => {
	return (req, res, next) => {
		try {
			res.locals.fMap = server.locals.fMap;
			res.locals.mapValueNames = server.locals.mapValueNames;
			const firstClusterURL = clusterUrls[0];

			//NOTE: all servers in cluster must have same credentials for now
			const base64Auth = Buffer.from(
				`${firstClusterURL.username}:${firstClusterURL.password}`,
			).toString('base64');
			const api = new OpenAPIClientAxios.default({
				//definition: `${firstClusterURL.origin}/v3/specification_openapiv3`,
				definition,
				axiosConfigDefaults: {
					httpsAgent: agent,
					headers: {
						'authorization': `Basic ${base64Auth}`,
					},
				},
			});
			const apiInstance = api.initSync();
			apiInstance.defaults.baseURL = `${firstClusterURL.origin}/v3`;
			res.locals.dataPlane = apiInstance;
			async function dataPlaneRetry(operationId, ...args) {
				let retryCnt = 0;
				console.log('dataplaneRetry', retryCnt, 'operation:', operationId);
				function run() {
					return apiInstance[operationId](...args).catch(function (err) {
						console.warn('dataplaneRetry error', retryCnt, 'error:', err);
						if (
							operationId === 'getRuntimeMapEntry' && err && err.response &&
							err.response.data && err.response.data.code === 404
						) {
							return null;
						}
						++retryCnt;
						console.error(
							'dataPlaneRetry retry',
							retryCnt,
							' after error',
							err,
						);
						console.trace();
						apiInstance.defaults.baseURL = `${clusterUrls[retryCnt].origin}/v3`;
						if (retryCnt > clusterUrls.length - 1) {
							console.error(
								'Max retries exceeded in dataPlaneRetry',
								err.message,
							);
							throw err;
						}
						return run();
					});
				}
				return run();
			}
			res.locals.dataPlaneRetry = dataPlaneRetry;

			res.locals.dataPlaneAll = async (
				operationId,
				parameters,
				data,
				config,
				all = false,
				blocking = true,
			) => {
				const promiseResults = await Promise[blocking ? 'all' : 'any'](
					clusterUrls.map(async (clusterUrl) => {
						const singleApi = new OpenAPIClientAxios.default({
							definition,
							axiosConfigDefaults: {
								httpsAgent: agent,
								headers: { 'authorization': `Basic ${base64Auth}` },
							},
						});
						const singleApiInstance = singleApi.initSync();
						singleApiInstance.defaults.baseURL = `${clusterUrl.origin}/v3`;
						console.time(`dataplaneAll ${clusterUrl.origin} ${operationId}`);
						let singleRes;
						try {
							singleRes = await singleApiInstance[operationId](parameters, data, {
								...config,
								baseUrl: `${clusterUrl.origin}/v3`,
							});
						} catch(e) {
							return e;
						}
						console.timeEnd(`dataplaneAll ${clusterUrl.origin} ${operationId}`);
						return singleRes;
					}),
				);
				console.log('dataplaneAll return, blocking:', blocking);
				return (all && blocking) ? promiseResults.map((p) => p.data) : promiseResults[0]; //TODO: better desync handling
			};
			res.locals.postFileAll = async (path, options, file, fdOptions) => {
				//used  for stuff that dataplaneapi with axios seems to struggle with e.g. multipart body
				const promiseResults = await Promise.all(
					clusterUrls.map((clusterUrl) => {
						const fd = new FormData(); //must resonctruct each time, or get a socket hang up
						fd.append('file_upload', file, fdOptions);
						return fetch(`${clusterUrl.origin}${path}`, {
							...options,
							body: fd,
							agent,
						}).then((resp) => resp.json());
					}),
				);
				return promiseResults[0]; //TODO: better desync handling
			};
			res.locals.purgeURL = async (url, ban=false) => {
				const urlObject = new URL(url); // URL to get the hostname and path
				const promiseResults = await Promise.all(
					clusterUrls.map(async (clusterUrl) => {
						await fetch(`${clusterUrl.protocol}//${clusterUrl.hostname}${urlObject.pathname}`, {
							method: ban === true ? 'BAN' : 'PURGE',
							headers: {
								'X-BasedFlare-Varnish-Key': process.env.VARNISH_SECRET_KEY,
								'Host': urlObject.hostname
							},
							// agent
						}).then(res => res.text());
					})
				);
				return promiseResults[0]; // TODO: better desync handling
			};
			next();
		} catch (e) {
			console.error(e);
			return dynamicResponse(req, res, 500, { error: e });
		}
	};
};
