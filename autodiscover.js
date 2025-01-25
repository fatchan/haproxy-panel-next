'use strict';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const base64Auth = Buffer.from(`${process.env.AUTODISCOVER_USER}:${process.env.AUTODISCOVER_PASS}`).toString('base64');
const fetchOptions = {
	headers: {
		'Authorization': `Basic ${base64Auth}`,
	}
};

class AutodiscoverService {
	#autodiscoveredHosts = [];

	async init() {
		await this.autodiscover(); // Initial autodiscover
		setInterval(() => this.autodiscover(), 60000); // Repeat autodiscover every 60 seconds
	}

	async autodiscover() {
		try {
			const response = await fetch(`${process.env.AUTODISCOVER_HOST}/v1/autodiscover`, fetchOptions);
			const json = await response.json();
			console.log('Autodiscovered %d hosts', json.length);
			this.#autodiscoveredHosts = json
				.filter(x => x.tags.includes('haproxy'))
				.map(h => new URL(`https://${process.env.DATAPLANE_USER}:${process.env.DATAPLANE_PASS}@${h.hostname}:2001/`));
		} catch (error) {
			console.error('Autodiscover failed:', error);
		}
	}

	get urls() {
		return this.#autodiscoveredHosts;
	}
}

export default AutodiscoverService;
