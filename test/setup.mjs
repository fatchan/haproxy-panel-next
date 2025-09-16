import { getAccount, getIncidents, getOnboarding, addDomain, getCsrf } from '../api.js';

describe('login and basic API smoke tests', () => {
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

  test('get account using API client', async () => {
    const customHeaders = { cookie: sessionCookie };
    const account = await getAccount(null, null, null, customHeaders);
    console.log(JSON.stringify(account));
    expect(account).toBeDefined();
  });

  test('get incidents using API client', async () => {
    const customHeaders = { cookie: sessionCookie };
    const incidents = await getIncidents(null, null, null, customHeaders);
    console.log(JSON.stringify(incidents));
    expect(incidents).toBeDefined();
  });

  test('get onboarding using API client', async () => {
    const customHeaders = { cookie: sessionCookie };
    const onboarding = await getOnboarding(null, null, null, customHeaders);
    console.log(JSON.stringify(onboarding));
    expect(onboarding).toBeDefined();
  });

  test('add domain example.com via addDomain API', async () => {
    const customHeaders = { cookie: sessionCookie };
    const body = { domain: 'example.com', _csrf: csrfToken };

    const addResp = await addDomain(body, null, null, null, customHeaders);
    if (addResp && typeof addResp.status === 'number') {
      expect(addResp.status).toBe(302);
    } else {
      expect(addResp).toBeDefined();
    }
    console.log(JSON.stringify(addResp));
  });

  test('get account after adding domain and verify example.com present', async () => {
    const customHeaders = { cookie: sessionCookie };

    const accountAfter = await getAccount(null, null, null, customHeaders);
    expect(accountAfter).toBeDefined();
    expect(accountAfter.user).toBeDefined();
    expect(Array.isArray(accountAfter.user.domains)).toBe(true);
    expect(accountAfter.user.domains).toContain('example.com');
  });

});
