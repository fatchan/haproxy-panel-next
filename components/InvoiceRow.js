import React from 'react';
import { allowedCryptos, calculateRemainingHours } from '../util.js';

const invoiceStatusColors = {
	'cancelled': 'secondary',
	'pending': 'primary',
	'paid': 'success',
	'unpaid': 'warning',
	'overdue': 'danger',
	'other': 'info',
	'upcoming': 'secondary',
	'expired': 'secondary',
};

const InvoiceRow = ({ inv, handleCryptoChange, openInvoice }) => {
	const remainingHours = inv.recalculate_after && calculateRemainingHours(inv.recalculate_after_start, inv.recalculate_after);
	const timedOut = remainingHours != null && remainingHours <= 0 && inv.status === 'unpaid';

	return (
		<tr key={inv._id} className='align-middle'>
			<td>{inv.description}</td>
			<td suppressHydrationWarning={true}>
				{inv.date
					? new Date(inv.date).toLocaleString()
					: <span className='text-secondary'><i className='bi-dash-lg pe-none' width='16' height='16' /></span>}
			</td>
			<td suppressHydrationWarning={true}>
				{new Date(inv.dueDate).toLocaleString()}
			</td>
			<td>${(inv.amount / 100).toFixed(2)}</td>
			<td>
				{timedOut
					? <span className={`badge rounded-pill text-bg-${invoiceStatusColors['unpaid']} text-uppercase`}>
						unpaid
					</span>
					: <span className={`badge rounded-pill text-bg-${invoiceStatusColors[inv.status]} text-uppercase`}>
						{inv.status}
					</span>}
			</td>
			<td>
				{inv.status !== 'upcoming' && <div className='d-flex gap-2'>
					{inv?.paymentData?.paid !== true ? (
						<>
							<select
								className='form-select form-select-sm'
								onChange={(e) => handleCryptoChange(inv._id, e.target.value)}
								value={inv?.paymentData?.crypto || ''}
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
						<button
							className='btn btn-primary btn-sm'
							onClick={() => openInvoice(inv)}
						>
							View
						</button>
					)}
				</div>}
			</td>
		</tr>
	);
};

export default InvoiceRow;

