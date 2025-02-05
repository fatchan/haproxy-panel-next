import Image from 'next/image';
let ResolvedImage = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import { useEffect, useState } from 'react';
import RemainingTime from './RemainingTime.js';
import { calculateRemainingHours } from '../util.js';

export default function PaymentModal({
	qrCodeText,
	paymentInfo,
	selectedInvoice,
	crypto,
	regenerateInvoice,
	closeModal,
	loading,
	clientName,
}) {
	const isPaid = selectedInvoice?.paymentData?.paid === true;
	const transactions = selectedInvoice?.paymentData?.transactions || [];
	const [expandedTxs, setExpandedTxs] = useState({});
	const [remainingHours, setRemainingHours] = useState(true);
	const invoiceDate = new Date(selectedInvoice?.date);
	const dueDate = new Date(invoiceDate);
	dueDate.setDate(invoiceDate.getDate() + 7);

	const handleToggleTx = (index) => {
		setExpandedTxs((prev) => ({ ...prev, [index]: !prev[index] }));
	};

	const updateRemainingHours = () => {
		if (selectedInvoice
			&& selectedInvoice.recalculate_after_start) {
			const hours = calculateRemainingHours(selectedInvoice.recalculate_after_start, selectedInvoice.recalculate_after);
			setRemainingHours(hours);
		}
	};

	useEffect(() => {
		updateRemainingHours();
		const intervalId = setInterval(updateRemainingHours, 60000);
		return () => clearInterval(intervalId);
	}, [selectedInvoice?._id, qrCodeText]);

	return (
		<div className='modal show d-block' tabIndex='-1' role='dialog' style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
			<div className='modal-dialog custom-offset' role='document'>
				<div className='modal-content'>
					<div className='modal-header'>
						<h5 className='modal-title'>Payment Information</h5>
						<button
							type='button'
							className='btn-close'
							onClick={() => closeModal()}
						></button>
					</div>
					<div className='modal-body'>
						{loading
							? <div className='d-flex'>
								<span className='spinner-border mx-auto' role='status' />
							</div>
							: <>
								<div className='row'>
									<div className='col-md-6 col-12'>
										<div className='fw-bold fs-5 mb-2'>Invoice Details:</div>
										<p><strong>Invoice ID:</strong> {selectedInvoice._id}</p>
										<p><strong>Invoice Date:</strong> {invoiceDate.toLocaleString()}</p>
										<p><strong>Due Date:</strong> {dueDate.toLocaleString()}</p>
										<p><strong>Description:</strong> {selectedInvoice.description}</p>
										<p><strong>Total Amount Due:</strong> ${selectedInvoice.amount / 100}</p>
										<p><strong>Crypto:</strong> {paymentInfo.display_name}</p>
										<p><strong>Fiat:</strong> USD</p>
										<p><strong>Exchange Rate:</strong> {paymentInfo.exchange_rate}</p>
									</div>
									<div className='col-md-6 col-12'>
										<div className='fw-bold fs-5 mb-2 mt-3 mt-md-0'>Bill To:</div>
										<p><strong>Client Name:</strong> {clientName}</p>

										<div className='fw-bold fs-5 mb-2 mt-4 mt-md-0'>Bill From:</div>
										<p><strong>Business Name:</strong> {process.env.NEXT_PUBLIC_BUSINESS_NAME}</p>
										<p><strong>Address:</strong> {process.env.NEXT_PUBLIC_BUSINESS_ADDRESS}</p>
										<p><strong>Phone:</strong> {process.env.NEXT_PUBLIC_BUSINESS_PHONE}</p>
										<p><strong>Email:</strong> {process.env.NEXT_PUBLIC_BUSINESS_EMAIL}</p>
									</div>
								</div>

								{/* Show payment details if the invoice is not fully paid */}
								{(!isPaid && paymentInfo) && (
									<>
										<hr />
										<p><strong>Wallet Address:</strong> <code>{paymentInfo.wallet}</code></p>
										<p><strong>Amount To Pay:</strong> <code>{paymentInfo.amount - (selectedInvoice?.paymentData?.balance_crypto || 0)}</code></p>
									</>
								)}

								{/* Show QR code text only if the invoice is not fully paid and not expired */}
								{!isPaid && qrCodeText && remainingHours > 0 && <ResolvedImage className='mb-3 d-block mx-auto' src={qrCodeText} alt='payment QR' />}

								{isPaid ? (
									<>
										<p><strong>Status:</strong> PAID</p>
										<p><strong>Paid with Crypto:</strong> {selectedInvoice.paymentData.crypto}</p>
										<p><strong>Wallet Address:</strong> <code>{selectedInvoice.paymentData.addr}</code></p>
										<p><strong>Total Fiat Paid:</strong> ${selectedInvoice.paymentData.balance_fiat}</p>
										<p><strong>Total Crypto Paid:</strong> {selectedInvoice.paymentData.balance_crypto} {selectedInvoice.paymentData.crypto}</p>
									</>
								) : (
									<>
										{selectedInvoice?.paymentData?.balance_crypto > 0 && (
											<p><strong>Amount Paid:</strong> {selectedInvoice?.paymentData?.balance_crypto}</p>
										)}
										{selectedInvoice.recalculate_after && <RemainingTime remainingHours={remainingHours} />}

										{/* Show regen button if the time is expired */}
										{remainingHours <= 0 && selectedInvoice.status !== 'expired' && (
											<button
												type='button'
												className='btn btn-primary mt-2'
												onClick={() => regenerateInvoice(selectedInvoice, crypto)}
											>
												Regenerate
											</button>
										)}
									</>
								)}

								{/* Show transaction table if there are any transactions */}
								{transactions.length > 0 && (
									<>
										<hr />
										<h6>Transaction(s) Details:</h6>
										<div className='table-responsive'>
											<table className='table table-sm'>
												<thead>
													<tr>
														<th>TxID</th>
														<th>Date</th>
														<th>Crypto Amount</th>
														<th>Fiat Amount</th>
														<th>Fee (Fiat)</th>
													</tr>
												</thead>
												<tbody>
													{transactions.map((tx, index) => (
														<tr key={index}>
															<td>
																<code
																	role='button'
																	onClick={() => handleToggleTx(index)}
																>
																	{expandedTxs[index] ? tx.txid : `${tx.txid.slice(0, 6)}...`}
																</code>
															</td>
															<td>{new Date(tx.date).toLocaleString()}</td>
															<td>{tx.amount_crypto} {tx.crypto}</td>
															<td>${tx.amount_fiat}</td>
															<td>${tx.fee_fiat}</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</>
								)}
							</>}
					</div>
					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-sm btn-secondary'
							onClick={() => closeModal()}
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
