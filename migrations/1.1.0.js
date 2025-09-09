export default async (db, _redis) => {
  const accountsCollection = db.db().collection('accounts');
  const orgsCollection = db.db().collection('orgs');
  const cursor = accountsCollection.find({ organisationId: { $exists: false } });
  while (await cursor.hasNext()) {
    const account = await cursor.next();
    const ownerId = account._id; // account _id is username
    await orgsCollection.insertOne({
      owner: ownerId,
      members: [ownerId],
      createdAt: new Date(),
    });
  }
};
