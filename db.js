import { MongoClient } from 'mongodb';

let _client;

export async function connect() {
	_client = new MongoClient(process.env.DB_URL);
	await _client.connect();
}

export function client() {
	return _client;
}

export function db() {
	return _client && _client.db();
}
