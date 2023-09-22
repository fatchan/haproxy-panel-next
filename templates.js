import * as db from './db.js';

export function aTemplate() {
	return db.db().collection('templates').findOne({ _id: 'a' }).then(res => res.data);
}

export function aaaaTemplate() {
	return db.db().collection('templates').findOne({ _id: 'aaaa' }).then(res => res.data);
};

export const soaTemplate = () => Object.seal(Object.freeze(Object.preventExtensions([
	{
		'ttl': 86400,
		'ns': 'ns1.basedns.net.',
		'MBox': 'root.basedflare.com.',
		'refresh': 7200,
		'retry': 3600,
		'expire': 3600,
		'minttl': 180,
		't': true
	},
])));

export const nsTemplate = () => Object.seal(Object.freeze(Object.preventExtensions([
	{
		'ttl': 86400,
		'host': 'ns1.basedns.net.',
		't': true
	},
	{
		'ttl': 86400,
		'host': 'ns2.basedns.cloud.',
		't': true
	},
	{
		'ttl': 86400,
		'host': 'ns3.basedns.services.',
		't': true
	}
])));
