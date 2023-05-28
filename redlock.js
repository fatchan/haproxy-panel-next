'use strict';

const Redlock = require('redlock').default;
const redis = require('./redis.js');
const redlock = new Redlock([redis.lockClient], {
	retryCount: 20,
	retryDelay: 500,
	retryJitter: 1000,
	automaticExtensionThreshold: 500,
});

redlock.on('clientError', console.error);

module.exports = redlock;
