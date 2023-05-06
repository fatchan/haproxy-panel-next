const { MongoClient } = require('mongodb');

module.exports = {

	connect: async () => {
		const client = new MongoClient(process.env.DB_URL);
		await client.connect();
		module.exports.client = client;
		module.exports.db = client.db();
	}

}
