import { useEffect, useState } from 'react';
import ErrorAlert from './ErrorAlert';

export default function RemainingTime({ remainingHours }) {
	const [timeText, setTimeText] = useState('');
	const isTimeExpired = remainingHours <= 0;

	useEffect(() => {
		if (!isTimeExpired) {
			const hoursLeft = Math.floor(remainingHours);
			const minutesLeft = Math.floor((remainingHours - hoursLeft) * 60);
			setTimeText(`${hoursLeft} hours, ${minutesLeft} minutes`);
		} else {
			setTimeText('');
		}
	}, [remainingHours, isTimeExpired]);

	return (<div className='text-center mb-4'>
		{isTimeExpired ? (
			<ErrorAlert error='This invoice has expired.' />
		) : (
			<>
				<p><strong>Remaining Time:</strong> {timeText} <span style={{ width: 15, height: 15 }} className='ms-1 spinner-border' role='status' /></p>
			</>
		)}
	</div>);
}
