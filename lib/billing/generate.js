import * as db from '../../db.js';
import  { ObjectId } from 'mongodb';
import sendEmail from '../email/send.js';
import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });

export default async function generateInvoices() {
	const currentMonth = new Date().getMonth();
	const currentYear = new Date().getFullYear();
	const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
	const startId = new ObjectId(Math.floor(startOfMonth.getTime() / 1000));
	const accountsCursor = db.db().collection('accounts').find({
		email: { $exists: true },
		billing: { $exists: true }
	}); //wip
	while (await accountsCursor.hasNext()) {
		try {
			const account = await accountsCursor.next();
			const existingInvoice = await db.db().collection('invoices').findOne({
				username: account._id.toString(),
				_id: {
					$gte: startId,
					//$lt: endId,
				},
			});
			if (!existingInvoice) {
				// If no unpaid invoice for the current month, create a new one
				const newInvoice = {
					username: account._id,
					amount: account.billing.price,
					description: account.billing.description,
					status: 'unpaid',
					date: new Date(),
					paymentData: null,
				};

				const result = await db.db().collection('invoices').insertOne(newInvoice);
				console.log(`Created unpaid invoice for user: ${account._id}`);
				const invoiceUrl = `${process.env.FRONTEND_URL}/billing`;
				//?invoice=${result.insertedId.toString()}`; //Note: default crypto needed to open prompt, so omitting for now
				const emailBody = `Dear ${account._id},

A new invoice (ID: ${result.insertedId.toString()}) has been issued. You can view and pay your invoices by clicking the link below:

${invoiceUrl}

If you have any questions, feel free to reach out to our support team.`;
				await sendEmail(account.email, 'New Invoice', emailBody);
			}
		} catch (e) {
			console.warn(e);
		}
	}
}

//TODO: system to send reminder emails on a cron
