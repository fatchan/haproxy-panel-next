/* globals test describe expect */
import { deleteDomain, getAccount, getCsrf } from '../api.js';

describe('cleanup tests', () => {
	let sessionCookie;
	let csrfToken;

	test('re-login to obtain session cookie', async () => {
		const params = new URLSearchParams();
		params.append('username', 'admin');
		params.append('password', process.env.TEST_ADMIN_PASSWORD);

		const res = await fetch('http://localhost:3000/forms/login', {
			method: 'POST',
			body: params,
			redirect: 'manual',
		});

		const hdr = res.headers;
		expect(hdr.get('set-cookie')).toBeDefined();
		expect(hdr.get('set-cookie')).toMatch(/^connect\.sid/);
		sessionCookie = hdr.get('set-cookie');
		console.log('Session Cookie:', sessionCookie);
	});

	test('fetch csrf token for cleanup', async () => {
		const customHeaders = { cookie: sessionCookie };
		csrfToken = await getCsrf(null, null, null, customHeaders);
		expect(typeof csrfToken).toBe('string');
		expect(csrfToken.length).toBeGreaterThan(0);
		console.log(JSON.stringify({ csrf: csrfToken }));
	});

	test('delete example.com via deleteDomain API and verify removal', async () => {
		const customHeaders = { cookie: sessionCookie };
		const body = { domain: 'example.com', _csrf: csrfToken };

		const delResp = await deleteDomain(body, null, null, null, customHeaders);
		console.log(JSON.stringify(delResp));
		if (delResp && typeof delResp.status === 'number') {
			expect([200, 201, 204, 302]).toContain(delResp.status);
		} else {
			expect(delResp).toBeDefined();
		}

		const accountAfterDelete = await getAccount(null, null, null, customHeaders);
		console.log(JSON.stringify(accountAfterDelete));
		expect(accountAfterDelete).toBeDefined();
		expect(accountAfterDelete.user).toBeDefined();
		expect(Array.isArray(accountAfterDelete.user.domains)).toBe(true);
		expect(accountAfterDelete.user.domains).not.toContain('example.com');
	});
});
