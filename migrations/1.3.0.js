import { Binary } from 'mongodb';
import Roles from '../lib/permissions/roles.js';

export default async function run(db, _redis) {
	const accountsCollection = db.db().collection('accounts');
	const orgsCollection = db.db().collection('orgs');
	const orgsCursor = orgsCollection.find({});
	while (await orgsCursor.hasNext()) {
		const org = await orgsCursor.next();

		const newMembers = {};
		const ownerName = org.owner;
    //Add new "permissions" to all org members/owners with correct default perms
		for (const [memberName, memberObj] of Object.entries(org.members)) {
			newMembers[memberName] = {
				addedDate: memberObj.addedDate,
				permissions: memberName === ownerName
					? new Binary(Buffer.from(Roles.roles.ORG_OWNER.array))
					: new Binary(Buffer.from(Roles.roles.ORG_MEMBER.array))
			};
		}

		await orgsCollection.updateOne(
			{ _id: org._id },
			{ $set: { members: newMembers } }
		);

    // set owned org id on account for faster reverse lookup
		await accountsCollection.updateOne(
			{ _id: ownerName },
			{ $set: { orgId: org._id } }
		);

	}

  //wildcard index members keys for efficient querying of own orgs
	db.orgs.createIndex({ 'members.$**': 1 });

}
