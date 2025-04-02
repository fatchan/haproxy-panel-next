'use strict';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Redis from 'ioredis';;

export const client = new Redis({
	host: process.env.REDIS_HOST || '127.0.0.1',
	port: process.env.REDIS_PORT || 6379,
	password: process.env.REDIS_PASS || '',
	db: 0,
});

export const lockQueueClient = new Redis({
	host: process.env.REDIS_HOST2 || '127.0.0.1',
	port: process.env.REDIS_PORT2 || 6379,
	password: process.env.REDIS_PASS2 || '',
	db: 1,
});

export const omeClient = new Redis({
	host: process.env.REDIS_HOST3 || '127.0.0.1',
	port: process.env.REDIS_PORT3 || 6379,
	password: process.env.REDIS_PASS3 || '',
	db: 0,
});

export function close () {
	client.quit();
	lockQueueClient.quit();
	omeClient.quit();
}

//set value with expiry
export function setex (key, expiry, value) {
	client.set(key, value)
		.then(() => client.expire(key, expiry));
}

//get a value with key
export function get (key) {
	return client.get(key).then(res => { return JSON.parse(res); });
}

//get a hash value
export function hgetall (key) {
	return client.hgetall(key).then(res => { return res; });
}

//get a hash value
export function hget (key, hash) {
	return client.hget(key, hash).then(res => { return JSON.parse(res); });
}

//set a hash value
export function hset (key, hash, value) {
	return client.hset(key, hash, JSON.stringify(value));
}

//delete a hash
export function hdel (key, hash) {
	return client.hdel(key, hash);
}

//set a value on key
export function set (key, value) {
	return client.set(key, JSON.stringify(value));
}

//delete value with key
export function del (keyOrKeys) {
	if (Array.isArray(keyOrKeys)) {
		return client.del(...keyOrKeys);
	} else {
		return client.del(keyOrKeys);
	}
}

export function getKeysPattern (redisClient, pattern) {
	return new Promise((resolve, reject) => {
		const stream = redisClient.scanStream({
			match: pattern,
			count: 20,
		});
		let allKeys = [];
		stream.on('data', (keys) => {
			if (!keys || keys.length === 0) { return; }
			allKeys = allKeys.concat(keys);
		});
		stream.on('end', async () => {
			resolve(allKeys);
		});
		stream.on('error', (err) => {
			reject(err);
		});
	});
}
