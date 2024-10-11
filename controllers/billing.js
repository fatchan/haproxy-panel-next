import * as db from '../db.js';
import ShkeeperManager from '../billing/shkeeper.js';
import  { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
await dotenv.config({ path: '.env' });
import { accountData } from './account.js';
import { calculateRemainingHours, dynamicResponse, allowedCryptos, createQrCodeText } from '../util.js';

/**
 * GET /billing
 * billing page
 */
export async function billingPage(app, req, res, next) {
	const [data, invoices] = await Promise.all([
		accountData(req, res, next),
		db.db().collection('invoices').find({ username: res.locals.user.username }).sort({ _id: -1 }).toArray(),
	]);
	res.locals.data = { ...data, invoices, user: res.locals.user };
	return app.render(req, res, '/billing');
}

/**
 * GET /billing.json
 * billing page json data
 */
export async function billingJson(req, res, next) {
	const [data, invoices] = await Promise.all([
		accountData(req, res, next),
		db.db().collection('invoices').find({ username: res.locals.user.username }).sort({ _id: -1 }).toArray(),
	]);
	return res.json({ ...data, invoices, user: res.locals.user });
}

/**
 * POST /forms/billing/payment_request
 * billing page json data
 */
export async function createPaymentRequest(req, res) {

	const { invoiceId, crypto } = req.body;

	if (!invoiceId || typeof invoiceId !== 'string' || invoiceId.length !== 24) {
		return dynamicResponse(req, res, 400, { error: 'Invoice ID is required' });
	}

	let invoice = await db.db().collection('invoices').findOne({
		username: res.locals.user.username,
		_id: ObjectId(invoiceId)
	});

	if (!invoice) {
		return dynamicResponse(req, res, 404, { error: 'Invoice not found' });
	}

	const existingCrypto = invoice?.paymentData?.crypto;
	const usingCrypto = existingCrypto || crypto;

	if (!existingCrypto && (!crypto || !allowedCryptos.includes(crypto))) {
		return dynamicResponse(req, res, 400, { error: 'Invalid or unsupported cryptocurrency' });
	}

	if (existingCrypto && crypto !== existingCrypto) {
		return dynamicResponse(req, res, 400, { error: `Crypto mismatch, partial payment already received in: "${invoice.paymentData.crypto}"` });
	}

	try {

		const shkeeperManager = new ShkeeperManager();
		let shkeeperResponse = await shkeeperManager.createPaymentRequest(
			usingCrypto,
			invoice._id.toString(),
			invoice.amount
		);

		if (!shkeeperResponse || !shkeeperResponse.wallet) {
			console.warn('shkeeperResponse:', shkeeperResponse);
			return dynamicResponse(req, res, 500, { error: 'Payment gateway error, try again later' });
		}

		const responseRecalculateAfter = shkeeperResponse.recalculate_after;
		let hoursRemaining;
		if (!invoice.recalculate_after && responseRecalculateAfter) {
			const recalculateAfterStart = new Date();
			await db.db().collection('invoices').updateOne({
				username: res.locals.user.username,
				_id: ObjectId(invoiceId)
			}, {
				$set: {
					recalculate_after: responseRecalculateAfter,
					recalculate_after_start: new Date(),
				}
			});
			invoice.recalculate_after_start = recalculateAfterStart;
			invoice.recalculate_after = responseRecalculateAfter;
			hoursRemaining = calculateRemainingHours(recalculateAfterStart, responseRecalculateAfter);
		} else {
			hoursRemaining = calculateRemainingHours(invoice.recalculate_after_start, invoice.recalculate_after);
		}

		console.log('hoursRemaining', hoursRemaining);
		console.log('invoice', invoice);

		// If no time remaining and no tpaid yet, create a new invoice
		if (hoursRemaining <= 0 && !invoice?.paymentData?.paid && invoice?.status !== 'expired') {
			const newInvoice = {
				...invoice,
				status: 'unpaid',
				_id: new ObjectId(),
				recalculate_after_start: new Date(),
				paymentData: null
			};

			//TODO: refactor
			shkeeperResponse = await shkeeperManager.createPaymentRequest(
				usingCrypto,
				newInvoice._id.toString(),
				newInvoice.amount //TODO: subtract part already paid from old invoice
			);

			if (!shkeeperResponse || !shkeeperResponse.wallet) {
				console.warn('shkeeperResponse:', shkeeperResponse);
				return dynamicResponse(req, res, 500, { error: 'Payment gateway error, try again later' });
			}

			const newInvoiceInsert = await db.db().collection('invoices').insertOne(newInvoice);
			if (!newInvoiceInsert.insertedId) {
				return dynamicResponse(req, res, 500, { error: 'Failed to create new invoice' });
			}
			if (invoice.paymentData) {
				// if it already had payment data, dont delete in case of needing support later;
				await db.db().collection('invoices').updateOne(
					{ username: res.locals.user.username, _id: ObjectId(invoiceId) },
					{ $set: { status: 'expired' } }
				);
			} else {
				await db.db().collection('invoices').deleteOne(
					{ username: res.locals.user.username, _id: ObjectId(invoiceId) },
				);
			}
			invoice = newInvoice;
			invoice.recalculate_after = shkeeperResponse.recalculate_after;

		}

		//generate different qr code uri depending on the crypto
		const qrCodeText = await createQrCodeText(shkeeperResponse, usingCrypto);

		return dynamicResponse(req, res, 200, { shkeeperResponse, qrCodeText, invoice: invoice  });

	} catch (error) {
		console.error('Error processing payment request:', error);
		return dynamicResponse(req, res, 500, { error: 'Internal server error' });
	}
};
