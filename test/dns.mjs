/* globals test describe expect */
import { getAccount, getDnsRecords, addUpdateDnsRecord, getCsrf } from '../api.js';

describe('dns record testing', () => {
	let sessionCookie;
	let csrfToken;

	test('login and save connect.sid', async () => {
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

	test('fetch csrf token', async () => {
		const customHeaders = { cookie: sessionCookie };
		csrfToken = await getCsrf(null, null, null, customHeaders);
		expect(typeof csrfToken).toBe('string');
		expect(csrfToken.length).toBeGreaterThan(0);
	});

	test('add DNS records for testing.com (all types)', async () => {
		const customHeaders = { cookie: sessionCookie };

		const domain = 'testing.com';
		const zone = 'example';

    // A record
		const aBody = {
			id_0: 'a',
			value_0: '192.0.2.1',
			ttl: 3600,
			_csrf: csrfToken,
		};
		const aResp = await addUpdateDnsRecord(domain, zone, 'a', aBody, null, null, null, customHeaders);
		console.log(JSON.stringify({ aResp }));

    // AAAA record
		const aaaaBody = {
			id_0: 'a',
			value_0: '2001:db8::1',
			ttl: 3600,
			_csrf: csrfToken,
		};
		const aaaaResp = await addUpdateDnsRecord(domain, zone, 'aaaa', aaaaBody, null, null, null, customHeaders);
		console.log(JSON.stringify({ aaaaResp }));

    // CNAME record
		const cnameBody = {
			value_0: 'alias.example.com',
			ttl: 3600,
			_csrf: csrfToken,
		};
		const cnameResp = await addUpdateDnsRecord(domain, zone, 'cname', cnameBody, null, null, null, customHeaders);
		console.log(JSON.stringify({ cnameResp }));

    // MX record
		const mxBody = {
			value_0: 'mail.testing.com',
			preference_0: 10,
			ttl: 3600,
			_csrf: csrfToken,
		};
		const mxResp = await addUpdateDnsRecord(domain, zone, 'mx', mxBody, null, null, null, customHeaders);
		console.log(JSON.stringify({ mxResp }));

    // TXT record
		const txtBody = {
			value_0: 'v=spf1 include:_spf.example.com ~all',
			ttl: 3600,
			_csrf: csrfToken,
		};
		const txtResp = await addUpdateDnsRecord(domain, zone, 'txt', txtBody, null, null, null, customHeaders);
		console.log(JSON.stringify({ txtResp }));

    // SRV record
		const srvBody = {
			value_0: '_sip._tcp.testing.com. 10 60 5060 sipserver.testing.com.',
			port_0: 5060,
			priority_0: 10,
			weight_0: 60,
			ttl: 3600,
			_csrf: csrfToken,
		};
		const srvResp = await addUpdateDnsRecord(domain, zone, 'srv', srvBody, null, null, null, customHeaders);
		console.log(JSON.stringify({ srvResp }));

    // NS record
		const nsBody = {
			value_0: 'ns1.testing.com',
			ttl: 3600,
			_csrf: csrfToken,
		};
		const nsResp = await addUpdateDnsRecord(domain, zone, 'ns', nsBody, null, null, null, customHeaders);
		console.log(JSON.stringify({ nsResp }));

    // SOA record
		const soaBody = {
			value_0: 'ns1.testing.com hostmaster.testing.com 2025010100 7200 3600 1209600 3600',
			ttl: 86400,
			_csrf: csrfToken,
		};
		const soaResp = await addUpdateDnsRecord(domain, zone, 'soa', soaBody, null, null, null, customHeaders);
		console.log(JSON.stringify({ soaResp }));

    //try overwriting "locked records" to @ zone, check locked error
    // NS record
		const nsBodyLocked = {
			value_0: 'ns1.testing.com',
			ttl: 3600,
			_csrf: csrfToken,
		};
		const nsRespLocked = await addUpdateDnsRecord(domain, '@', 'ns', nsBodyLocked, null, null, null, customHeaders);
		console.log(JSON.stringify({ nsRespLocked }));

    // SOA record
		const soaBodyLocked = {
			value_0: 'ns1.testing.com hostmaster.testing.com 2025010100 7200 3600 1209600 3600',
			ttl: 86400,
			_csrf: csrfToken,
		};
		const soaRespLocked = await addUpdateDnsRecord(domain, '@', 'soa', soaBodyLocked, null, null, null, customHeaders);
		console.log(JSON.stringify({ soaRespLocked }));

		expect(aaaaResp.redirect).toBeDefined();
		expect(cnameResp.redirect).toBeDefined();
		expect(mxResp.redirect).toBeDefined();
		expect(txtResp.redirect).toBeDefined();
		expect(srvResp.redirect).toBeDefined();
		expect(nsResp.redirect).toBeDefined();
		expect(soaResp.redirect).toBeDefined();
		expect(nsRespLocked.error).toContain('locked records');
		expect(soaRespLocked.error).toContain('locked records');
	});

	test('get DNS records for testing.com and validate entries', async () => {
		const customHeaders = { cookie: sessionCookie };
		const domain = 'testing.com';
		const zone = 'example';

		const getRecordSet = async (type) => {
			const res = await getDnsRecords(domain, zone, type, null, null, null, customHeaders);
			return res.recordSet;
		};

		const a = await getRecordSet('a');
		expect(Array.isArray(a)).toBe(true);
		expect(a.some(r => r.id === 'a' && r.ip === '192.0.2.1')).toBe(true);

		const aaaa = await getRecordSet('aaaa');
		expect(Array.isArray(aaaa)).toBe(true);
		expect(aaaa.some(r => r.ip === '2001:db8::1')).toBe(true);

		const cname = await getRecordSet('cname');
		expect(Array.isArray(cname)).toBe(true);
		expect(cname.some(r => r.host === 'alias.example.com')).toBe(true);

		const mx = await getRecordSet('mx');
		expect(Array.isArray(mx)).toBe(true);
		expect(mx.some(r => r.host === 'mail.testing.com' && (r.preference === 10 || r.preference === '10'))).toBe(true);

		const txt = await getRecordSet('txt');
		expect(Array.isArray(txt)).toBe(true);
		expect(txt[0].text).toBe('v=spf1 include:_spf.example.com ~all');

		const srv = await getRecordSet('srv');
		expect(Array.isArray(srv)).toBe(true);
		expect(srv.some(r => (r.target === '_sip._tcp.testing.com. 10 60 5060 sipserver.testing.com.'))).toBe(true);

		const ns = await getRecordSet('ns');
		expect(Array.isArray(ns)).toBe(true);
		expect(ns.some(r => r.host === 'ns1.testing.com')).toBe(true);

		const soa = await getRecordSet('soa');
		expect(Array.isArray(soa)).toBe(true);
		expect(soa.some(r => r.ns === 'ns1.testing.com hostmaster.testing.com 2025010100 7200 3600 1209600 3600')).toBe(true);
	});

	test('get account after dns', async () => {
		const customHeaders = { cookie: sessionCookie };
		const account = await getAccount(null, null, null, customHeaders);
		console.log(JSON.stringify(account));
		expect(account).toBeDefined();
	});

});
