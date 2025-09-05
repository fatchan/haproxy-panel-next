import { Resolver } from 'node:dns/promises';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const localNSResolver = new Resolver();
localNSResolver.setServers(process.env.NAMESERVERS.split(','));
const cloudflareResolver = new Resolver();
cloudflareResolver.setServers(['1.1.1.1']);
const googleResolver = new Resolver();
googleResolver.setServers(['8.8.8.8']);
const quad9Resolver = new Resolver();
quad9Resolver.setServers(['9.9.9.9']);
const publicResolvers = [cloudflareResolver, googleResolver, quad9Resolver];

export const nameserverTxtDomains = process.env.NAMESERVER_TXT_DOMAINS.split(',');

export const expectedNSRecords = new Set(process.env.NAMESERVERS_HOSTS.split(','));

export async function getNameserverTxtRecords() {
	// for dev
	if (process.env.NAMESERVER_TXT_DOMAINS === 'localhost') {
		return ['localhost'];
	}

	for (const ntd of nameserverTxtDomains) {
		try {

			const txtRecords = await localNSResolver.resolve(ntd, 'TXT');
			if (txtRecords && txtRecords.length > 0) {
				return txtRecords;
			}
		} catch (error) {
			console.error(`Error querying TXT records for ${ntd}:`, error);
		}
	}
	return []; //todo: handle better on FE if none found at all
}

const nameserversToCheck = process.env.NAMESERVERS === '127.0.0.1'
	? [localNSResolver] //for dev
	: publicResolvers;

export async function checkPublicDNSRecord(domain, type, expectedSet) {
	const results = await Promise.all(nameserversToCheck.map(async pr => {
		const res = await pr.resolve(domain, type);
		console.log('res', res);
		return new Set(res || []);
	}));
	return results.every(res => res.size === new Set([...res, ...expectedSet]).size);
}

