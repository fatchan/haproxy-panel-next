import 'dotenv/config';
import { Binary, ObjectId } from 'mongodb';
import * as db from './db.js';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import Roles from './lib/permissions/roles.js';
import packageJson from './package.json' with { type: 'json' };

async function reset() {
	await db.connect();
	const numAccounts = await db.db().collection('accounts').countDocuments();
	const randomPassword = randomBytes(20).toString('base64');

	//set current version on reset for bootstrap
	await db.db().collection('version').updateOne({
		'_id': 'version'
	}, {
		$set: { version: packageJson.version }
	});

	console.log(randomPassword);
	const passwordHash = await bcrypt.hash(randomPassword, 12);
	if (numAccounts === 0) {
		const createdOrg = await db.db().collection('orgs').insertOne({
			owner: 'admin',
			members: {
				'admin': {
					addedDate: new Date(),
					permissions: Binary(Roles.roles.ORG_OWNER.array)
				}
			},
			createdAt: new Date(),
		});
		await db.db().collection('accounts')
			.insertOne({
				_id: 'admin',
				streamsId: ObjectId().toString(),
				email: 'localhost',
				emailVerified: true,
				displayName: 'admin',
				passwordHash: passwordHash,
				domains: ['localhost'],
				onboarding: true,
				billing: { price: 1, description: 'Free trial', capabilities: ['organisations'], maxDomains: 100, allowedTemplates: ['basic'], },
				inactive: false,
				orgId: createdOrg.insertedId,
			});

	} else {
		await db.db().collection('accounts')
			.updateOne({
				_id: 'admin'
			}, {
				$set: {
					passwordHash,
				}
			});
		await db.db().collection('orgs').updateOne({
			owner: 'admin'
		}, {
			$set: {
				members: {
					'admin': {
						addedDate: new Date(),
						permissions: Binary(Roles.roles.ORG_OWNER.array)
					}
				},
				createdAt: new Date(),
			}
		});
	}
	await db.db().collection('streams').createIndex({ userName: 1, appName: 1 });
	db.client().close();
}

reset();
