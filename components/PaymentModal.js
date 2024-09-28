export default function PaymentModal({
	setPaymentInfo,
	setQrCodeText,
	qrCodeText,
	paymentInfo,
	selectedInvoice,
}) {
	return (
		<div className='modal show d-block mt-5 pt-5' tabIndex='-1' role='dialog'>
			<div className='modal-dialog' role='document'>
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
						<p><strong>Invoice ID:</strong> {selectedInvoice}</p>
						<p><strong>Crypto:</strong> {paymentInfo.display_name}</p>
						<p><strong>Fiat:</strong> USD</p> {/* TODO: customisable */}
						<p><strong>Exchange Rate:</strong> {paymentInfo.exchange_rate}</p>
						<hr />
						<p><strong>Wallet Address:</strong> <code>{paymentInfo.wallet}</code></p>
						<p><strong>Amount To Pay:</strong> <code>{paymentInfo.amount}</code></p>

						{/* QR Code Text */}
						{qrCodeText && (
							<pre className='mt-3' style={{
								'background': 'white',
								'color': 'black',
								'lineHeight': '1.15em',
								'fontFamily': 'monospace',
								'margin': '10px auto',
								'letterSpacing': '-0.22px',
								'overflow': 'hidden',
								'width': 'min-content'
							}}>{qrCodeText}</pre>
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
	)
}
