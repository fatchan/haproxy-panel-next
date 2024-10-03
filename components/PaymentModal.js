import { useState } from 'react';

import RemainingTime from './RemainingTime.js';

export default function PaymentModal({
	setPaymentInfo,
	setQrCodeText,
	qrCodeText,
	paymentInfo,
	selectedInvoice,
}) {
	const isPaid = selectedInvoice?.paymentData?.paid;
	const transactions = selectedInvoice?.paymentData?.transactions || [];
	const [expandedTxs, setExpandedTxs] = useState({});

	const handleToggleTx = (index) => {
		setExpandedTxs((prev) => ({ ...prev, [index]: !prev[index] }));
	};

	return (
		<div className='modal show d-block' tabIndex='-1' role='dialog' style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
			<div className='modal-dialog custom-offset' role='document'>
				<div className='modal-content'>
					<div className='modal-header'>
						<h5 className='modal-title'>Payment Information</h5>
						<button
							type='button'
							className='btn-close'
							onClick={() => {
								setPaymentInfo(null);
								setQrCodeText(null);
							}}
						></button>
					</div>
					<div className='modal-body'>
						<p><strong>Invoice ID:</strong> {selectedInvoice._id}</p>
						<p><strong>Description:</strong> {selectedInvoice.description}</p>
						<p><strong>Date Due:</strong> {new Date(selectedInvoice.date).toLocaleString()}</p>
						<p><strong>Total:</strong> ${selectedInvoice.amount / 100}</p>

						{/* Show payment details if the invoice is not fully paid */}
						{!isPaid && paymentInfo && (
							<>
								<hr />
								<p><strong>Crypto:</strong> {paymentInfo.display_name}</p>
								<p><strong>Fiat:</strong> USD</p>
								<p><strong>Exchange Rate:</strong> {paymentInfo.exchange_rate}</p>
								<p><strong>Wallet Address:</strong> <code>{paymentInfo.wallet}</code></p>
								<p><strong>Amount To Pay:</strong> <code>{paymentInfo.amount - (selectedInvoice?.paymentData?.balance_crypto||0)}</code></p>
							</>
						)}

						{/* Show QR code text only if the invoice is not fully paid */}
						{!isPaid && qrCodeText && <img className='mb-3 d-block mx-auto' src={qrCodeText} />}

						{isPaid ? (
							<>
								<p><strong>Status:</strong> PAID</p>
								<p><strong>Paid with Crypto:</strong> {selectedInvoice.paymentData.crypto}</p>
								<p><strong>Wallet Address:</strong> <code>{selectedInvoice.paymentData.addr}</code></p>
								<p><strong>Total Fiat Paid:</strong> ${selectedInvoice.paymentData.balance_fiat}</p>
								<p><strong>Total Crypto Paid:</strong> {selectedInvoice.paymentData.balance_crypto} {selectedInvoice.paymentData.crypto}</p>
							</>
						) : <>
							{selectedInvoice?.paymentData?.balance_crypto > 0 &&
								<p><strong>Amount Paid:</strong> {selectedInvoice?.paymentData?.balance_crypto}</p>
							}
							{selectedInvoice.recalculate_after && <RemainingTime selectedInvoice={selectedInvoice} />}
						</>}

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
					</div>
					<div className='modal-footer'>
						<button
							type='button'
							className='btn btn-sm btn-secondary'
							onClick={() => {
								setPaymentInfo(null);
								setQrCodeText(null);
							}}
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

