import 'dotenv/config';
import generateInvoices from '../lib/billing/generate.js';
import * as db from '../db.js';

(async () => {
	await db.connect();
	generateInvoices();
	setInterval(generateInvoices, 3600000);
})();
