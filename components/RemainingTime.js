import { useEffect, useState } from 'react';

const RemainingTime = ({ selectedInvoice }) => {
	const [remainingTime, setRemainingTime] = useState('');
	useEffect(() => {
		const calculateRemainingTime = () => {
			const recalculateAfterHours = selectedInvoice.recalculate_after;
			const recalculateStartDate = new Date(selectedInvoice.recalculate_after_start);
			const currentTime = new Date();

			const timeDifferenceMs = currentTime - recalculateStartDate;
			const timeDifferenceHours = timeDifferenceMs / (1000 * 60 * 60);
			const remainingHours = recalculateAfterHours - timeDifferenceHours;

			if (remainingHours > 0) {
				const hoursLeft = Math.floor(remainingHours);
				const minutesLeft = Math.floor((remainingHours - hoursLeft) * 60);
				setRemainingTime(`${hoursLeft} hours, ${minutesLeft} minutes`);
			} else {
				setRemainingTime('Time expired');
			}
		};
		calculateRemainingTime();
		const intervalId = setInterval(calculateRemainingTime, 60000);
		return () => clearInterval(intervalId);
	}, []);
	return (
		<div>
			{selectedInvoice.recalculate_after && selectedInvoice.recalculate_after_start && (
				<p><strong>Remaining Time:</strong> {remainingTime}</p>
			)}
		</div>
	);
};

export default RemainingTime;
