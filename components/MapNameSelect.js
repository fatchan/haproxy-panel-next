import React from 'react';
import Select from 'react-select';

const mapOptions = [
	{ label: 'IP/Subnet', value: 'blockedip' },
	{ label: 'ASN', value: 'blockedasn' },
	{ label: 'Country', value: 'blockedcc' },
	{ label: 'Continent', value: 'blockedcn' },
];

export default function MapNameSelect({ value, onChange }) {
	const selectedOption = mapOptions.find(o => o.value === value) || null;
	return (
		<Select
			menuPosition='fixed'
			options={mapOptions}
			value={selectedOption}
			onChange={(option) => onChange(option?.value ?? '')}
			classNamePrefix='select'
			className='basic-multi-select'
			name='key'
			required
		/>
	);
}
