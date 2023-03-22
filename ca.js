'use strict';

const { generateKeyPairSync } = require('crypto')
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
	if (!allowedDomains.includes(subject)) {
		throw new Error('No permission for subject');
	}
	const exts = csr.getAttribute({name: 'extensionRequest'});
	if (exts && exts.extensions) {
		const altNamesExt = exts.extensions.find(ext => ext.name === 'subjectAltName');
		if (altNamesExt) {
			const badAltNames = altNamesExt.altNames.some(altName => {
				return !allowedDomains.includes(altName.value);
			});
			if (badAltNames) {
				throw new Error('No permission for altnames');
			}
		}
	}
	const caCert = RootCACertificate;
	const caKey = RootCAPrivateKey;
	if (!csr.verify()) {
		throw new Error('Signature not verified.');
	}
	const cert = pki.createCertificate();
	cert.serialNumber = `00${serialNumber}${Math.floor(Math.random()*100)}`;
	//TODO: shorter/customisable
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
	cert.setSubject(csr.subject.attributes); //CSR subject (user sets IP)
	cert.setIssuer(caCert.subject.attributes); //CA issuer
	cert.setExtensions([
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
	]);
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
