'use strict';

const Redlock = require('redlock').default;
const redis = require('./redis.js');
const redlock = new Redlock([redis.client]);

redlock.on('clientError', console.error);

module.exports = redlock;
