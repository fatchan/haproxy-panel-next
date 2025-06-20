import generateInvoices from '../lib/billing/generate.js';
import * as db from '../db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

(async () => {
	await db.connect();
	generateInvoices();
	setInterval(generateInvoices, 3600000);
})();
