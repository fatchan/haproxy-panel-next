'use strict';

const Redis = require('ioredis')
	, client = new Redis({
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: process.env.REDIS_PORT || 6379,
		password: process.env.REDIS_PASS || '',
	});

module.exports = {

	client,

	close: () => {
		client.quit();
	},

	//get a value with key
	get: (key) => {
		return client.get(key).then(res => { return JSON.parse(res); });
	},

	//get a hash value
	hgetall: (key) => {
		return client.hgetall(key).then(res => { return res });
	},
	
	//get a hash value
	hget: (key, hash) => {
		return client.hget(key, hash).then(res => { return JSON.parse(res); });
	},

	//set a value on key
	set: (key, value) => {
		return client.set(key, JSON.stringify(value));
	},
	
	//delete value with key
	del: (keyOrKeys) => {
		if (Array.isArray(keyOrKeys)) {
			return client.del(...keyOrKeys);
		} else {
			return client.del(keyOrKeys);
		}
	},

};
