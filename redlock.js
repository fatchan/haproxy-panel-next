'use strict';

import Redlock from 'redlock';
import * as redis from './redis.js';
const redlock = new Redlock([redis.lockClient], {
	retryCount: 20,
	retryDelay: 500,
	retryJitter: 1000,
	automaticExtensionThreshold: 500,
});

redlock.on('clientError', console.error);

export default redlock;
