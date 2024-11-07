import * as db from '../../db.js';
import  { ObjectId } from 'mongodb';

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
				//if no unpaid for the current month, create a new one
				const newInvoice = {
					username: account._id,
					amount: account.billing.price,
					description: account.billing.description,
					status: 'unpaid',
					date: new Date(),
					paymentData: null,
				};

				await db.db().collection('invoices').insertOne(newInvoice);
				console.log(`Created unpaid invoice for user: ${account._id}`);
			}
		} catch (e) {
			console.warn(e);
		}
	}
}
