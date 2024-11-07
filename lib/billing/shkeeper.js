import * as db from '../../db.js';
import { ObjectId } from 'mongodb';
import sendEmail from '../email/send.js';

class ShkeeperManager {
	constructor() {
		this.baseUrl = process.env.SHKEEPER_BASE_URL;
		this.apiKey = process.env.SHKEEPER_API_KEY;
	}

	async createPaymentRequest(cryptoName, externalId, amount) {
		const url = `${this.baseUrl}/api/v1/${cryptoName}/payment_request`;
		const body = {
			external_id: externalId,
			fiat: 'USD',
			amount: (amount / 100).toFixed(2), // div by 100 because se store in cents, duh
			callback_url: `${process.env.SHKEEPER_CALLBACK_BASE_URL}/forms/billing/callback`
		};

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'X-Shkeeper-API-Key': this.apiKey,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			throw new Error(`SHKeeper API request failed: ${response.statusText}`);
		}

		return response.json();
	}

	// Method to handle callback from SHKeeper
	async handleCallback(req, res) {

		// check shkeeper api callback (i wish this was was a signature check)
		const shkeeperApiKey = req.headers['x-shkeeper-api-key'];
		if (shkeeperApiKey !== this.apiKey) {
			return res.status(403).json({ error: 'Forbidden' });
		}

		const callbackData = req.body;

		console.log('callbackData', callbackData);

		if (!callbackData || !callbackData.external_id) {
			return res.status(400).json({ error: 'Invalid callback data: missing external_id' });
		}

		try {

			const updateRes = await db.db().collection('invoices').updateOne(
				{ _id: ObjectId(callbackData.external_id) },
				{
					$set: {
						paymentData: callbackData,
						...(callbackData.paid === true ? { status: 'paid' } : { /* partial payment status ?? */ })
					}
				}
			);

			if (!updateRes || !updateRes.matchedCount || updateRes.matchedCount === 0) {
				return res.status(400).json({ error: 'Invalid callback: external_id transaction not found' });
			}

			if (callbackData.paid === true) {
				const paidInvoice = await db.db().collection('invoices').findOne({
					_id: ObjectId(callbackData.external_id),
				});
				if (paidInvoice) {
					const invoiceAccount = await db.db().collection('accounts').findOne({
						_id: paidInvoice.username,
					});
					if (invoiceAccount) {
						//Note: not awaiting the send
						sendEmail(invoiceAccount.email, 'Invoice Payment Received', `Dear ${paidInvoice.username},

Payment for invoice ${paidInvoice._id.toString()} was received successfully.

You can view full invoice detalis by clicking the link below:

${process.env.FRONTEND_URL}/billing?invoice=${paidInvoice._id.toString()}&crypto=${paidInvoice.paymentData.transactions[0].crypto}

If you have any questions, feel free to reach out to our support team.`);

					}
				}
			}

			// shkeeper expects 202 as per docs
			return res.status(202).send();
		} catch (error) {
			console.error('Error processing SHKeeper callback:', error);
			return res.status(500).json({ error: 'Internal server error' });
		}
	}
}

export default ShkeeperManager;
