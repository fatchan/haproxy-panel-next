export default async function run(db, _redis) {
	const orgsCollection = db.db().collection('orgs');
	const accountsCollection = db.db().collection('accounts');

	//make orgs.members from array to obj
	const orgsCursor = orgsCollection.find({ members: { $type: 'array' } });
	while (await orgsCursor.hasNext()) {
		const org = await orgsCursor.next();
		const membersArray = org.members || [];
		const membersObj = {};
		for (const username of membersArray) {
			membersObj[username] = { addedDate: new Date() };
		}
		await orgsCollection.updateOne(
			{ _id: org._id },
			{ $set: { members: membersObj } }
		);
	}

	//update accounts.billing to ensure billing.capabilities exists.
	const accountsCursor = accountsCollection.find({});
	while (await accountsCursor.hasNext()) {
		const account = await accountsCursor.next();
		const billing = (account.billing && typeof account.billing === 'object') ? { ...account.billing } : {};
		//add organisations if Enterprise plan else empty
		const capabilities = [];
		if (billing.description === 'Enterprise plan') {
			capabilities.push('organisations');
		}
		billing.capabilities = capabilities;

		await accountsCollection.updateOne(
			{ _id: account._id },
			{ $set: { billing } }
		);
	}
}
