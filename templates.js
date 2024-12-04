import * as db from './db.js';
import { soaTemplate, nsTemplate } from './instance-config.js';

export function aTemplate(template) {
	return db.db().collection('templates').findOne({
		type: 'a',
		...(template ? { template } : { template: 'basic' })
	}).then(res => res.data);
}

export function aaaaTemplate(template) {
	return db.db().collection('templates').findOne({
		type: 'aaaa',
		...(template ? { template } : { template: 'basic' })
	}).then(res => res.data);
};

export async function getAllTemplateIps(type, allowedTemplates) {
	const ipsAggregate = await db.db().collection('templates').aggregate([
		{
			$match: {
				type,
				...(allowedTemplates
					? { template: { $in: allowedTemplates /*only templates allowed by their account*/ } }
					: {}),
			}
		}, {
			$unwind: '$data'
		}, {
			$group: {
				_id: null,
				ips: {
					$addToSet: '$data.ip'
				},
			}
		}, {
			$project: {
				_id: 0,
				ips: {
					$filter: {
						input: '$ips',
						as: 'ipn',
						cond: {
							$and: [{ $ne: ['$$ipn', ''] }, { $ne: ['$$ipn', null] }]
						}
					}
				},
			}
		}
	]).toArray();
	return ipsAggregate && ipsAggregate.length > 0
		? ipsAggregate[0].ips
		: [];
}

export const getSoaTemplate = () => Object.seal(Object.freeze(Object.preventExtensions(soaTemplate)));

export const getNsTemplate = () => Object.seal(Object.freeze(Object.preventExtensions(nsTemplate)));

// Trim trailing . from ns hosts and map to array of just hosts
export const trimmedNsHosts = getNsTemplate().map(nsRec => nsRec.host.substring(0, nsRec.host.length-1));
