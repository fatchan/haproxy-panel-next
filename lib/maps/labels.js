const ProtectionModes = {
	NONE: '0',
	POW_SUSPICIOUS_ONLY: '1',
	CAPTCHA_SUSPICIOUS_ONLY: '2',
	POW_ALL: '3',
	POW_ALL_CAPTCHA_SUSPICIOUS_ONLY: '4',
	CAPTCHA_ALL: '5',
};

const SusLevels = {
	TOR: '1',
	BFP: '2',
	VPN: '3',
	DC: '4',
};

export const mapValueNames = {
	m: {
		[ProtectionModes.NONE]: 'None',
		[ProtectionModes.POW_SUSPICIOUS_ONLY]: 'PoW (Suspicious Only)',
		[ProtectionModes.CAPTCHA_SUSPICIOUS_ONLY]: 'Captcha (Suspicious Only)',
		[ProtectionModes.POW_ALL]: 'PoW (All)',
		[ProtectionModes.POW_ALL_CAPTCHA_SUSPICIOUS_ONLY]: 'PoW (All) + Captcha (Suspicious Only)',
		[ProtectionModes.CAPTCHA_ALL]: 'Captcha (All)',
	},
	l: {
		[SusLevels.TOR]: '1 (Tor Exits)',
		[SusLevels.BFP]: '2 (+Fingerprints)',
		[SusLevels.VPN]: '3 (+VPNs)',
		[SusLevels.DC]: '4 (+Datacenters)',
	}
};

export const protectionModeSet = new Set(Object.values(ProtectionModes));
export const susLevelSet = new Set(Object.values(SusLevels));

