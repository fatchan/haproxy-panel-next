'use strict';

import fs from 'node:fs';
import https from 'https';
import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });

const agentOptions = {
	rejectUnauthorized: process.env.ALLOW_SELF_SIGNED_SSL !== 'true',
};

if (process.env.PINNED_FP) {
	console.log('Pinned fingerprint:', process.env.PINNED_FP);
	agentOptions.checkServerIdentity = (_host, cert) => {
		//TODO: host verification? e.g. tls.checkServerIdentity(host, cert);
		console.log('Checking:', cert.fingerprint256);
		if (process.env.PINNED_FP !== cert.fingerprint256) {
			return new Error('Certificate not pinned');
		}
	};
}

if (process.env.CUSTOM_CA_PATH) {
	console.log('Private CA file path:', process.env.CUSTOM_CA_PATH);
	agentOptions.ca = fs.readFileSync(process.env.CUSTOM_CA_PATH);
}

const agent = new https.Agent(agentOptions);
export default agent;

