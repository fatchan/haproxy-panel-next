import React from 'react';
import Select from 'react-select';
import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
import { continentOptions } from '../lib/misc/geo.js';
import Link from 'next/link';
countries.registerLocale(enCountries);
const countryOptions = Object.entries(countries.getNames('en')).map(e => ({ value: e[0], label: `${e[1]} (${e[0]})` }));

const MapFormFields = ({ map, formType, mapName, mapValueNames, user, editValue, handleFieldChange, handleSave, handleCancel, noButtons, noRowWrapper }) => {
	let formElements;

	switch (mapName) {
		case 'ddos': {
			const mapValueOptions = Object.entries(mapValueNames).reduce((acc, [v, mvn]) => {
				const valueOptions = Object.entries(mvn).map((entry, i) => (
					<option key={`option${i}`} value={entry[0].toString()}>{entry[1]}</option>
				));
				acc[v] = valueOptions;
				return acc;
			}, {});
			formElements = (
				<tr className='align-middle'>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>
					<td>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
							name='key'
							placeholder='domain/path'
							required
						/>
					</td>
					<td>
						<select
							className='form-select'
							{...(handleFieldChange ? { value: editValue?.m?.toString() || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('m', e.target.value.toString())}
							name='m'
							required
						>
							<option disabled value=''>protection mode</option>
							{mapValueOptions['m']}
						</select>
					</td>
					<td>
						<select
							className='form-select'
							{...(handleFieldChange ? { value: editValue.l || 1 } : { defaultValue: 1 })}
							onChange={(e) => handleFieldChange && handleFieldChange('l', e.target.value)}
							name='l'
							required
							disabled={!['1', '2', '4'].includes(editValue?.m?.toString())}
						>
							{mapValueOptions['l']}
						</select>
					</td>
				</tr>
			);
			break;
		}
		case 'ddos_config': {
			const domainSelectOptions = user?.domains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			const firstRow = (<>
				<td>
					{formType === 'add' ? (
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					) : (
						<>
							<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
								<i className='bi-floppy-fill pe-none' width='16' height='16' />
							</button>
							<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
								<i className='bi-x-lg pe-none' width='16' height='16' />
							</button>
						</>
					)}
				</td>
				<td>
					<select
						className='form-select'
						{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
						onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
						name='key'
						required
					>
						<option value='' />
						{domainSelectOptions}
					</select>
				</td>
				<td colSpan={formType === 'edit' ? 1 : 2}>
					<select
						className='form-select'
						{...(handleFieldChange ? { value: editValue.pt || '' } : { defaultValue: '' })}
						onChange={(e) => handleFieldChange && handleFieldChange('pt', e.target.value)}
						name='pt'
						required
					>
						<option disabled value=''>pow type</option>
						<option value='sha256'>sha256</option>
						<option value='argon2'>argon2</option>
					</select>
				</td>
				<td colSpan={formType === 'edit' ? 1 : 2}>
					<input
						className='form-control'
						type='number'
						min='8'
						{...(handleFieldChange ? { value: editValue?.pd?.toString() || '' } : { defaultValue: '' })}
						onChange={(e) => handleFieldChange && handleFieldChange('pd', e.target.value.toString())}
						name='pd'
						placeholder='difficulty'
						required
					/>
				</td>
				<td colSpan={formType === 'edit' ? 1 : 2}>
					<input
						className='form-control'
						type='number'
						{...(handleFieldChange ? { value: editValue?.cex?.toString() || '' } : { defaultValue: '' })}
						onChange={(e) => handleFieldChange && handleFieldChange('cex', e.target.value.toString())}
						name='cex'
						placeholder='cookie expiry (seconds)'
						required
					/>
				</td>
			</>);
			const secondRow = (<>
				{formType === 'edit' ? null : <td colSpan='2' />}
				<td colSpan={formType === 'edit' ? 1 : 2}>
					<div className='form-check'>
						<input
							className='form-check-input'
							type='checkbox'
							{...(handleFieldChange ? { checked: editValue.cip === true } : { defaultChecked: editValue.cip === true })}
							onChange={(e) => handleFieldChange && handleFieldChange('cip', e.target.checked ? true : false)}
							name='cip'
						/>
						{formType === 'add' && <label className='form-check-label'>Lock cookie to IP</label>}
					</div>
				</td>
				<td colSpan={formType === 'edit' ? 1 : 2}>
					<div className='form-check'>
						<input
							className='form-check-input'
							type='checkbox'
							{...(handleFieldChange ? { checked: editValue.sl === true } : { defaultChecked: editValue.sl === true })}
							onChange={(e) => handleFieldChange && handleFieldChange('sl', e.target.checked ? true : false)}
							name='sl'
						/>
						{formType === 'add' && <label className='form-check-label'>Require Interaction</label>}
					</div>
				</td>
				<td colSpan={formType === 'edit' ? 1 : 2}>
					<div className='form-check'>
						<input
							className='form-check-input'
							type='checkbox'
							{...(handleFieldChange ? { checked: editValue.js !== false } : { defaultChecked: editValue.js !== false })}
							onChange={(e) => handleFieldChange && handleFieldChange('js', e.target.checked ? true : false)}
							name='js'
						/>
						{formType === 'add' && <label className='form-check-label'>Show NoJS</label>}
					</div>
				</td>
			</>
			);
			formElements = formType === 'edit' ? (
				<tr className='align-middle'>
					{firstRow}
					{secondRow}
				</tr>
			) : (
				<>
					<tr className='align-middle' style={{ borderBottom: 'transparent' }}>
						{firstRow}
					</tr>
					<tr className='align-middle'>
						{secondRow}
					</tr>
				</>);
			break;
		}
		case 'redirect':
		case 'rewrite': {
			formElements = (
				<tr className='align-middle'>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>
					<td>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
							name='key'
							placeholder='domain'
							required
						/>
					</td>
					<td>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.value || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('value', e.target.value)}
							name='value'
							placeholder='domain or domain/path'
							required
						/>
					</td>
				</tr>
			);
			break;
		}
		case 'images': {
			const activeDomains = (map || []).map(e => e.key);
			const inactiveDomains = user?.domains?.filter(d => !activeDomains.includes(d)) || [];
			const domainSelectOptions = inactiveDomains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<tr className='align-middle'>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>
					<td>
						<select
							className='form-select'
							{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
							name='key'
							required
						>
							<option value='' />
							{domainSelectOptions}
						</select>
					</td>
					<td>
						<select
							className='form-select'
							{...(handleFieldChange ? { value: editValue.image || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('image', e.target.value)}
							name='image'
							required
						>
							<option value=''>Image</option>
							<option value='bot-check'>Bot-check page icon</option>
						</select>
					</td>
					<td>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.value || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('value', e.target.value)}
							name='value'
							placeholder='example.com/image.png'
							required
						/>
					</td>
				</tr>
			);
			break;
		}
		case 'css': {
			const activeDomains = (map || []).map(e => e.key);
			const inactiveDomains = user?.domains?.filter(d => !activeDomains.includes(d)) || [];
			const domainSelectOptions = inactiveDomains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<tr className='align-middle'>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>
					<td>
						<select
							className='form-select'
							{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
							name='key'
							required
						>
							<option value='' />
							{domainSelectOptions}
						</select>
					</td>
					<td>
						<textarea
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.value || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('value', e.target.value)}
							name='value'
							placeholder='.class { ... }'
							required
						/>
					</td>
				</tr>
			);
			break;
		}
		case 'maintenance': {
			const activeDomains = (map || []).map(e => e.key);
			const inactiveDomains = user?.domains?.filter(d => !activeDomains.includes(d)) || [];
			const domainSelectOptions = inactiveDomains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<tr className='align-middle'>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>
					<td>
						<select
							className='form-select'
							{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
							name='key'
							required
						>
							<option value='' />
							{domainSelectOptions}
						</select>
					</td>
				</tr>
			);
			break;
		}
		case 'blockedip':
		case 'whitelist': {
			const rowElements = (<>
				{!noButtons && <td>
					{formType === 'add' ? (
						<button className='btn btn-sm btn-success' type='submit'>
							<i className='bi-plus-lg pe-none' width='16' height='16' />
						</button>
					) : (
						<>
							<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
								<i className='bi-floppy-fill pe-none' width='16' height='16' />
							</button>
							<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
								<i className='bi-x-lg pe-none' width='16' height='16' />
							</button>
						</>
					)}
				</td>}
				<td className='w-50'>
					<input
						className='form-control'
						type='text'
						{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
						onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
						placeholder='ip or subnet'
						name='key'
						required
					/>
				</td>
				<td className='w-50'>
					<input
						className='form-control'
						type='text'
						{...(handleFieldChange ? { value: editValue.note || '' } : { defaultValue: '' })}
						onChange={(e) => handleFieldChange && handleFieldChange('note', e.target.value)}
						name='note'
						placeholder='Note'
					/>
				</td>
			</>
			);
			formElements = noRowWrapper ? rowElements : <tr className='align-middle'>{rowElements}</tr>
			break;
		}
		case 'blockedasn': {
			const rowElements = (
				<>
					{!noButtons && <td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>}
					<td className='w-50'>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
							name='key'
							placeholder='ASN'
							required
						/>
					</td>
					<td className='w-50'>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.note || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('note', e.target.value)}
							name='note'
							placeholder='Note'
						/>
					</td>
				</>
			);
			formElements = noRowWrapper ? rowElements : <tr className='align-middle'>{rowElements}</tr>
			break;
		}
		case 'hosts': {
			const domainSelectOptions = user?.domains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<tr className='align-middle'>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>
					<td>
						<select
							className='form-select'
							{...(handleFieldChange ? { value: editValue.key || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('key', e.target.value)}
							name='key'
							required
						>
							<option value='' />
							{domainSelectOptions}
						</select>
					</td>
					<td>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.h || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('h', e.target.value)}
							name='h'
							placeholder='backend ip:port'
							required
						/>
					</td>
					<td>
						<Select
							menuPosition='fixed'
							options={continentOptions}
							{...(handleFieldChange ? { value: continentOptions.find(option => option.value === editValue.geo) || '' } : { defaultValue: '' })}
							onChange={(option) => handleFieldChange && handleFieldChange('geo', option.value)}
							classNamePrefix='select'
							className='basic-multi-select'
							name='geo'
							required
						/>
					</td>
					<td>
						<div className='form-check'>
							<input
								className='form-check-input'
								type='checkbox'
								{...(handleFieldChange ? { checked: editValue.xp === true } : { defaultChecked: editValue.xp === true })}
								onChange={(e) => handleFieldChange && handleFieldChange('xp', e.target.checked ? true : false)}
								name='xp'
							/>
							{formType === 'add' && <label className='form-check-label'><Link href='/kb/ports' target='_blank'>Extra Ports</Link></label>}
						</div>
					</td>
					<td>
						<div className='form-check'>
							<input
								className='form-check-input'
								type='checkbox'
								{...(handleFieldChange ? { checked: editValue.c === true } : { defaultChecked: editValue.c === true })}
								onChange={(e) => handleFieldChange && handleFieldChange('c', e.target.checked ? true : false)}
								name='c'
							/>
							{formType === 'add' && <label className='form-check-label'>Health Check</label>}
						</div>
					</td>
				</tr>
			);
			break;
		}
		case 'blockedcc': {
			const rowElements = (
				<>
					{!noButtons && <td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>}
					<td className='w-50'>
						<Select
							menuPosition='fixed'
							options={countryOptions}
							{...(handleFieldChange ? { value: countryOptions.find(option => option.value === editValue.key) || '' } : { defaultValue: '' })}
							onChange={(option) => handleFieldChange && handleFieldChange('key', option.value)}
							classNamePrefix='select'
							className='basic-multi-select'
							name='key'
							required
						/>
					</td>
					<td className='w-50'>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.note || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('note', e.target.value)}
							name='note'
							placeholder='Note'
						/>
					</td>
				</>
			);
			formElements = noRowWrapper ? rowElements : <tr className='align-middle'>{rowElements}</tr>
			break;
		}
		case 'blockedcn': {
			const rowElements = (
				<>
					{!noButtons && <td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-floppy-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>}
					<td className='w-50'>
						<Select
							menuPosition='fixed'
							options={continentOptions.filter(x => x.value !== 'XX')}
							{...(handleFieldChange ? { value: continentOptions.find(option => option.value === editValue.key) || '' } : { defaultValue: '' })}
							onChange={(option) => handleFieldChange && handleFieldChange('key', option.value)}
							classNamePrefix='select'
							className='basic-multi-select'
							name='key'
							required
						/>
					</td>
					<td className='w-50'>
						<input
							className='form-control'
							type='text'
							{...(handleFieldChange ? { value: editValue.note || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('note', e.target.value)}
							name='note'
							placeholder='Note'
						/>
					</td>
				</>
			);
			formElements = noRowWrapper ? rowElements : <tr className='align-middle'>{rowElements}</tr>
			break;
		}
		default:
			// should never really get here
			formElements = <td>Unsupported map type</td>;
	}

	return formElements;
};

export default MapFormFields;
