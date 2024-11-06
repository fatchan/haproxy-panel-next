import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import PaymentModal from '../components/PaymentModal.js';
import { allowedCryptos } from '../util.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import { calculateRemainingHours } from '../util.js';

const statusColors = {
	'cancelled': 'secondary',
	'pending': 'primary',
	'paid': 'success',
	'unpaid': 'warning',
	'overdue': 'danger',
	'other': 'info',
	'expired': 'secondary'
};

export default function Billing(props) {
	const router = useRouter();
	const [state, dispatch] = useState(props || {});
	const [error, setError] = useState();
	const [paymentInfo, setPaymentInfo] = useState(null);
	const [selectedInvoice, setSelectedInvoice] = useState(null);
	const [qrCodeText, setQrCodeText] = useState(null);
	const [loading, setLoading] = useState(false);
	const [selectedCrypto, setSelectedCrypto] = useState({});

	const updateBilling = () => API.getBilling(dispatch, setError, router, false);

	const closeModal = () => {
		setPaymentInfo(null);
		setQrCodeText(null);
		router.push({
			pathname: '/billing',
			query: null
		}, undefined, { shallow: true });
	};

	//disable loading state after open
	useEffect(() => {
		if (paymentInfo) {
			setLoading(false);
		}
	}, [paymentInfo]);

	useEffect(() => {
		if (!state || !state.invoices) {
			updateBilling();
		}
	}, []);

	// auto refresh invoices
	useEffect(() => {
		const interval = setInterval(() => updateBilling(), 10000);
		return () => clearInterval(interval);
	}, []);

	//load up initial invoice from query on refresh
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const invoice = params.get('invoice');
		const crypto = params.get('crypto');
		if (invoice) {
			setLoading(true);
			const matchedInvoice = state.invoices.find(inv => inv._id === invoice);
			if (matchedInvoice) {
				openInvoice(matchedInvoice, crypto);
			}
		}
	}, []);

	useEffect(() => {
		if (selectedInvoice) {
			const matchingSelectedInvoice = state.invoices
				.find(i => i._id.toString() === selectedInvoice._id.toString());
			if (matchingSelectedInvoice) {
				setSelectedInvoice(matchingSelectedInvoice);
			}
		}
	}, [state.invoices]);

	if (!state.invoices) {
		return (
			<div className='d-flex flex-column'>
				{error && <ErrorAlert error={error} />}
				<div className='text-center mb-4'>
					<div className='spinner-border mt-5' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	const { invoices, csrf, user } = state;

	function openInvoice(invoice, previousCrypto) {
		setLoading(true);
		const crypto = selectedCrypto[invoice._id] || invoice?.paymentData?.crypto || previousCrypto;
		API.createPaymentRequest({
			_csrf: csrf,
			invoiceId: invoice._id,
			crypto
		}, (data) => {
			setLoading(false);
			updateBilling();
			setError(null);
			setPaymentInfo(data.shkeeperResponse);
			setQrCodeText(data.qrCodeText);
			const setInvoice = data.invoice || invoice;
			setSelectedInvoice(setInvoice);
			router.push({
				pathname: '/billing',
				query: {
					invoice: setInvoice._id,
					crypto,
				}
			}, undefined, { shallow: true });
		}, err => {
			setError(err);
			setLoading(false);
		}, router);
	}

	const handleCryptoChange = (invoiceId, crypto) => {
		setSelectedCrypto((prev) => ({ ...prev, [invoiceId]: crypto }));
	};

	return (
		<>
			<Head>
				<title>Billing</title>
			</Head>

			<h5 className='fw-bold'>
				Invoices:
			</h5>

			{/* Invoices table */}
			<div className='table-responsive round-border'>
				<table className='table text-nowrap'>
					<tbody>
						<tr className='align-middle'>
							<th>Description</th>
							<th>Date</th>
							<th>Amount</th>
							<th>Status</th>
							<th>Action</th>
						</tr>
						{invoices.map((inv) => {
							const remainingHours = inv.recalculate_after && calculateRemainingHours(inv.recalculate_after_start, inv.recalculate_after);
							const timedOut = remainingHours != null && remainingHours <= 0 && inv.status === 'unpaid';
							return (
								<tr key={inv._id} className='align-middle'>
									<td>{inv.description}</td>
									<td suppressHydrationWarning={true}>
										{new Date(inv.date).toLocaleString()}
									</td>
									<td>${(inv.amount / 100).toFixed(2)}</td>
									<td>
										{timedOut
											? <span className={`badge rounded-pill text-bg-${statusColors['unpaid']} text-uppercase`}>
												unpaid
											</span>
											: <span className={`badge rounded-pill text-bg-${statusColors[inv.status]} text-uppercase`}>
												{inv.status} {/*remainingHours > 0 && `(times out in ${remainingHours.toFixed(remainingHours < 1 ? 1 : 0)} hours)`*/}
											</span>}
									</td>
									<td>
										<div className='d-flex gap-2'>
											{inv?.paymentData?.paid !== true /*&& !timedOut*/ ? (
												//dropdown and pay button for unpaid invoices
												<>
													<select
														className='form-select form-select-sm'
														onChange={(e) => handleCryptoChange(inv._id, e.target.value)}
														value={inv?.paymentData?.crypto || selectedCrypto[inv._id] || ''}
														disabled={inv.status === 'paid' || inv?.paymentData?.crypto}
														required
													>
														<option value='' disabled>Select crypto</option>
														{allowedCryptos.map((crypto) => (
															<option key={crypto} value={crypto}>{crypto}</option>
														))}
													</select>
													<button
														className='btn btn-success btn-sm'
														onClick={() => openInvoice(inv)}
													>
														Pay
													</button>
												</>
											) : (
												//view button for paid invoices
												<button
													className='btn btn-primary btn-sm'
													onClick={() => openInvoice(inv)}
												>
													View
												</button>
											)}
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* Payment Information Modal */}
			{(paymentInfo != null || loading === true) && <PaymentModal
				setPaymentInfo={setPaymentInfo}
				setQrCodeText={setQrCodeText}
				qrCodeText={qrCodeText}
				paymentInfo={paymentInfo}
				selectedInvoice={selectedInvoice}
				crypto={selectedInvoice ? selectedCrypto[selectedInvoice._id] : null}
				regenerateInvoice={openInvoice}
				closeModal={closeModal}
				loading={loading}
				clientName={user.username}
			/>}

			{/* Back to account */}
			<BackButton to='/dashboard' />
		</>
	);
}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data)) };
}
