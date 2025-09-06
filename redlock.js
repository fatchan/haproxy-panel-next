import Redlock from 'redlock';
import * as redis from './redis.js';
const redlock = new Redlock([redis.lockQueueClient], {
	retryCount: 30,
	retryDelay: 2000,
	retryJitter: 1000,
	automaticExtensionThreshold: 1000,
});

redlock.on('clientError', console.error);

//https://github.com/mike-marcacci/node-redlock/issues/169#issuecomment-2503707511
//https://archive.is/iQ8rl
const originalAcquire = Redlock.prototype.acquire;
Redlock.prototype.acquire = async function (...args) {
	const duration = args[1];
	args[2] = {
		retryCount: Math.ceil((duration / 2_000) * 1.5), //1.5x for some headroom
		retryDelay: 2_000,
		...args[2],
	};
	return originalAcquire.apply(this, args);
};

const originalRelease = Redlock.prototype.release;
Redlock.prototype.release = async function (...args) {
	const now = new Date().getTime();
	if (args[0] && args[0].expiration > now) {
		return originalRelease.apply(this, args);
	}
	return {
		attempts: [],
	};
};

export default redlock;
