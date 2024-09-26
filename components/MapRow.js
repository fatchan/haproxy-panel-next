import { useState } from 'react';
import { useRouter } from 'next/router';
import MapFormFields from './MapFormFields.js';
import asnMap from '../maps/asn.json';
import * as API from '../api.js';

export default function MapRow({ map, row, onDeleteSubmit, name, csrf, showValues, mapValueNames, columnKeys, mapNote, showNote, setError, user }) {
	const { key, value } = row;
	const router = useRouter();

	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState({
		key,
		...(typeof value === 'object' ? { ...value } : { value: value}),
		...(mapNote ? { note: mapNote } : {})
	});
	const [originalState, setOriginalState] = useState({
		key,
		...(typeof value === 'object' ? { ...value } : { value: value}),
		...(mapNote ? { note: mapNote } : {})
	});

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleCancel = () => {
		setEditValue(originalState);
		setIsEditing(false);
	};

	const handleSave = (event) => {
		event.preventDefault();

		const payload = {
			_csrf: csrf,
			...editValue,
			edit: true,
		};

		API.addToMap(
			name,
			payload,
			async () => {
				if (originalState.key !== editValue.key) {
					API.deleteFromMap(name, { _csrf: csrf, key: originalState.key }, null, setError, router, 1);
				}
				setOriginalState(editValue);
				setIsEditing(false);
			},
			setError,
			router,
			originalState.key !== editValue.key ? 0.5 : 1
		);
	};

	const handleFieldChange = (field, newValue) => {
		setEditValue((prev) => ({
			...prev,
			[field]: newValue,
		}));
	};

	return (
		<tr className='align-middle'>
			{isEditing ? (
				<MapFormFields
					map={map}
					formType='edit'
					mapName={name}
					mapValueNames={mapValueNames}
					user={user}
					editValue={editValue}
					handleFieldChange={handleFieldChange}
					handleSave={handleSave}  // Pass handleSave
					handleCancel={handleCancel}  // Pass handleCancel
				/>
			) : (
				<>
					<td className='text-left'>
						<a className='btn btn-sm btn-primary me-2' onClick={handleEdit} role='button'>
							<i className='bi-pencil-fill pe-none' width='16' height='16' />
						</a>
						<a className='btn btn-sm btn-danger' onClick={() => {
							if (name === 'hosts') {
								confirm('If you get an error deleting a backend, please contact support');
							}
							onDeleteSubmit(csrf, editValue.key);
						}} role='button'>
							<i className='bi-trash-fill pe-none' width='16' height='16' />
						</a>
					</td>
					<td>
						{editValue.key}{name === 'blockedasn' && asnMap[editValue.key] && ` (${asnMap[editValue.key]})`}
					</td>
					{showNote && (
						<td>
							{editValue.note ? editValue.note : <span className='text-secondary'><i className='bi-dash-lg pe-none' width='16' height='16' /></span>}
						</td>
					)}
					{typeof value === 'string' && showValues === true && (
						<td>
							{mapValueNames[editValue.value] || editValue.value}
						</td>
					)}
					{typeof value === 'object' && columnKeys.map((ck, mvi) => {
						let displayValue = editValue[ck];

						if (typeof displayValue === 'boolean' || displayValue === 'true' || displayValue === 'false') {
							displayValue = displayValue === true || displayValue === 'true' ? (
								<span className='text-success'><i className='bi-check-lg pe-none' width='16' height='16' /></span>
							) : (
								<span className='text-secondary'><i className='bi-dash-lg pe-none' width='16' height='16' /></span>
							);
						} else if (displayValue) {
							displayValue = mapValueNames[displayValue.toString()] || displayValue.toString();
						}

						return <td key={`mvi_${mvi}`}>{displayValue}</td>;
					})}
				</>
			)}
		</tr>
	);
}
