'use strict';

const { generateKeyPairSync } = require('crypto')
	, { wildcardAllowed } = require('./util.js')
	, fs = require('fs')
	, forge = require('node-forge')
	, pki = forge.pki
	, CAAttrs = [
		// {
			// name: "commonName",
			// value: "cp.basedflare.com",
		// },
		{
			name: "countryName",
			value: "XX",
		},
		{
			shortName: "ST",
			value: "BASEDFLARE",
		},
		{
			name: "localityName",
			value: "BASEDFLARE",
		},
		{
			name: "organizationName",
			value: "BASEDFLARE",
		},
		{
			shortName: "OU",
			value: "BASEDFLARE",
		},
	];

let RootCAPrivateKey = null
	, RootCAPublicKey = null
	, RootCACertificate = null;

function generateCAKeyPair() {
	return generateKeyPairSync('rsa', {
		modulusLength: 4096,
		publicKeyEncoding: {
			type: 'spki',
			format: 'pem'
		},
		privateKeyEncoding: {
			type: 'pkcs8',
			format: 'pem',
			// cipher: 'aes-256-cbc',
			// passphrase: 'changeme'
		}
	});
}

function generateCertificate(privateKey, publicKey) {
	const prKey = pki.privateKeyFromPem(privateKey);
	const pubKey = pki.publicKeyFromPem(publicKey);
	const cert = pki.createCertificate();
	cert.publicKey = pubKey;
	cert.serialNumber = `00${Math.floor(Math.random()*1000)}`;
    //TODO: shorter/customisable
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
	cert.setSubject(CAAttrs);
	cert.setIssuer(CAAttrs);
	cert.setExtensions([	
		{
			name: "basicConstraints",
			cA: true,
		},
		{
			name: "keyUsage",
			keyCertSign: true,
			digitalSignature: true,
			nonRepudiation: true,
			keyEncipherment: true,
			dataEncipherment: true,
		},
	]);
	cert.sign(prKey, forge.md.sha256.create());
	return pki.certificateToPem(cert);
}

function verifyCSR(csrPem, allowedDomains, serialNumber) {
	const csr = pki.certificationRequestFromPem(csrPem);
	const subject = csr.subject.getField('CN').value;
	const isWildcard = subject.startsWith('*.');
	if (subject.startsWith('*.')) {
		if (!wildcardAllowed(subject, allowedDomains)) {
			throw new Error(`No permission for subject "${subject}"`);
		}
	} else if (!allowedDomains.includes(subject)) {
		throw new Error(`No permission for subject "${subject}"`);
	}
	const exts = csr.getAttribute({ name: 'extensionRequest' });
	let altNamesExt;
	if (exts && exts.extensions) {
		altNamesExt = exts.extensions.find(ext => ext.name === 'subjectAltName');
		if (altNamesExt) {
			const badAltNames = altNamesExt.altNames.filter(altName => {
				if (altName.value.startsWith('*.')) {
					return !wildcardAllowed(altName.value, allowedDomains);
				}
				return !allowedDomains.includes(altName.value);
			});
			if (badAltNames && badAltNames.length > 0) {
				throw new Error(`No permission for altname(s) ${badAltNames}`);
			}
		}
	}
	const caCert = RootCACertificate;
	const caKey = RootCAPrivateKey;
	if (!csr.verify()) {
		throw new Error('Signature verification failed, please contact support.');
	}
	const cert = pki.createCertificate();
	cert.serialNumber = `00${serialNumber}${Math.floor(Math.random()*100)}`;
	//TODO: shorter/customisable
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
	cert.setSubject(csr.subject.attributes); //CSR subject (user sets domain)
	cert.setIssuer(caCert.subject.attributes); //CA issuer
	const certExtensions = [
		{
			name: "basicConstraints",
			cA: false,
		},
		{
			name: "keyUsage",
			digitalSignature: true,
			nonRepudiation: true,
			keyEncipherment: true,
			dataEncipherment: true,
		},
	];
	if (altNamesExt && altNamesExt.altNames) {
		certExtensions.push({
			name: 'subjectAltName',
			altNames: altNamesExt.altNames.map(an => ({
				type: 2, // DNS
				value: an.value
			}))
		});
	}
	cert.setExtensions(certExtensions);
	cert.publicKey = csr.publicKey;
	cert.sign(caKey, forge.md.sha256.create());
	return pki.certificateToPem(cert);
}

try {
	RootCAPrivateKey = pki.privateKeyFromPem(fs.readFileSync('./ca/ca-private-key.pem'));
	RootCAPublicKey = pki.publicKeyFromPem(fs.readFileSync('./ca/ca-public-key.pem'));
	RootCACertificate = pki.certificateFromPem(fs.readFileSync('./ca/ca-cert.pem'));
} catch (e) {
	console.warn('CA cert not loaded:', e);
}

if (!RootCAPrivateKey || !RootCAPublicKey || !RootCACertificate) {
	console.log('Generating root CA Keys');
	const Keys = generateCAKeyPair();
	RootCAPrivateKey = Keys.privateKey;
	RootCAPublicKey = Keys.publicKey;
	fs.writeFileSync('./ca/ca-private-key.pem', RootCAPrivateKey, { encoding: 'utf-8' });
	fs.writeFileSync('./ca/ca-public-key.pem', RootCAPublicKey, { encoding: 'utf-8' });
	console.log('Generating root CA Cert');
	const CACert = generateCertificate(RootCAPrivateKey, RootCAPublicKey);
	RootCACertificate = pki.certificateFromPem(CACert);
	fs.writeFileSync('./ca/ca-cert.pem', CACert, { encoding: 'utf-8' });
}

module.exports = {
	// generateCAKeyPair,
	// generateCertificate,
	verifyCSR,
};
