'use strict';

const https = require('https')

const agentOptions = {
	rejectUnauthorized: !process.env.ALLOW_SELF_SIGNED_SSL,
};

if (process.env.PINNED_FP && process.env.CUSTOM_CA_PATH) {
	// console.log('Pinned fingerprint:', process.env.PINNED_FP);
	// console.log('Private CA file path:', process.env.CUSTOM_CA_PATH);
	agentOptions.ca = require('fs').readFileSync(process.env.CUSTOM_CA_PATH);
	agentOptions.checkServerIdentity = (host, cert) => {
		//TODO: host verification? e.g. tls.checkServerIdentity(host, cert);
		// console.log('Checking:', cert.fingerprint256);
		if (process.env.PINNED_FP !== cert.fingerprint256) {
			return new Error('Certificate not pinned');
		}
	}
}

module.exports = new https.Agent(agentOptions);
