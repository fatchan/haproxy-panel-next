export default async function run(db, _redis) {
	const accountsCollection = db.db().collection('accounts');
	const accountsCursor = accountsCollection.find({});
	while (await accountsCursor.hasNext()) {
		const account = await accountsCursor.next();
		const billing = account.billing;
		billing.maxDomains = account.maxDomains;
		billing.allowedTemplates = account.allowedTemplates;
		await accountsCollection.updateOne(
			{ _id: account._id },
			{ $set: { billing }, $unset: { maxDomains: '', allowedTemplates: '' } }
		);
	}
}
