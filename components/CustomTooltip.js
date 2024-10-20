import React from 'react';

const CustomTooltip = ({ active, payload, formatter }) => {
	if (!active || !payload || payload.length === 0) {
		return null;
	}
	const sortedPayload = payload.sort((a, b) => b.value - a.value);
	return (
		<div
			className='p-2'
			style={{
				minWidth: '200px',
				background: 'var(--bs-body-bg)',
				border: '1px solid var(--bs-border-color-translucent)'
			}}>
			<h6>{sortedPayload[0].payload.time}</h6>
			<ul className='list-unstyled p-0 m-0'>
				{sortedPayload.map((entry, index) => (
					<li key={`item-${index}`} style={{ color: entry.color }}>
						{`${entry.name}: ${formatter ? formatter(entry.value) : entry.value}`}
					</li>
				))}
			</ul>
		</div>
	);
};

export default CustomTooltip;
