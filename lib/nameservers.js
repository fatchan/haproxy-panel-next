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

export async function checkPublicDNSRecord(domain, type, expectedSet) {
  const results = await Promise.all(publicResolvers.map(async pr => {
    const res = await pr.resolve(domain, type);
    return new Set(res || []);
  }));
  return results.every(res => res.size === new Set([...res, ...expectedSet]).size);
}

