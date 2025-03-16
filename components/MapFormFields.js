import React from 'react';
import Select from 'react-select';
import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
import { continentMap, continentOptions } from '../lib/misc/continents.js';
countries.registerLocale(enCountries);
const countryOptions = Object.entries(countries.getNames('en')).map(e => ({ value: e[0], label: `${e[1]} (${e[0]})` }));

const MapFormFields = ({ map, formType, mapName, mapValueNames, user, editValue, handleFieldChange, handleSave, handleCancel }) => {
	let formElements;

	switch (mapName) {
		case 'ddos': {
			const mapValueOptions = Object.entries(mapValueNames).map((entry, i) => (
				<option key={`option${i}`} value={entry[0].toString()}>{entry[1]}</option>
			));
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
							{mapValueOptions}
						</select>
					</td>
					<td>
						<div className='form-check'>
							<input
								className='form-check-input'
								type='checkbox'
								{...(handleFieldChange ? { checked: editValue.t === true } : { defaultChecked: editValue.t === true })}
								onChange={(e) => handleFieldChange && handleFieldChange('t', e.target.checked ? true : false)}
								name='t'
							/>
							<label className='form-check-label'>Tor exits only</label>
						</div>
					</td>
				</>
			);
			break;
		}
		case 'ddos_config': {
			const domainSelectOptions = user?.domains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
							type='number'
							min='8'
							{...(handleFieldChange ? { value: editValue?.pd?.toString() || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('pd', e.target.value.toString())}
							name='pd'
							placeholder='difficulty'
							required
						/>
					</td>
					<td>
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
					<td>
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
					<td>
						<div className='form-check'>
							<input
								className='form-check-input'
								type='checkbox'
								{...(handleFieldChange ? { checked: editValue.cip === true } : { defaultChecked: editValue.cip === true })}
								onChange={(e) => handleFieldChange && handleFieldChange('cip', e.target.checked ? true : false)}
								name='cip'
							/>
							<label className='form-check-label'>Lock cookie to IP</label>
						</div>
					</td>
					<td>
						<div className='form-check'>
							<input
								className='form-check-input'
								type='checkbox'
								{...(handleFieldChange ? { checked: editValue.js !== false } : { defaultChecked: editValue.js !== false })}
								onChange={(e) => handleFieldChange && handleFieldChange('js', e.target.checked ? true : false)}
								name='js'
							/>
							<label className='form-check-label'>Show NoJS</label>
						</div>
					</td>

				</>
			);
			break;
		}
		case 'redirect':
		case 'rewrite': {
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
				</>
			);
			break;
		}
		case 'images': {
			const activeDomains = (map || []).map(e => e.key);
			const inactiveDomains = user?.domains.filter(d => !activeDomains.includes(d));
			const domainSelectOptions = inactiveDomains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
				</>
			);
			break;
		}
		case 'css': {
			const activeDomains = (map || []).map(e => e.key);
			const inactiveDomains = user?.domains.filter(d => !activeDomains.includes(d));
			const domainSelectOptions = inactiveDomains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
				</>
			);
			break;
		}
		case 'maintenance': {
			const activeDomains = (map || []).map(e => e.key);
			const inactiveDomains = user?.domains.filter(d => !activeDomains.includes(d));
			const domainSelectOptions = inactiveDomains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
				</>
			);
			break;
		}
		case 'blockedip':
		case 'whitelist': {
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
							placeholder='ip or subnet'
							name='key'
							required
						/>
					</td>
					<td>
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
			break;
		}
		case 'blockedasn': {
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
							placeholder='ASN'
							required
						/>
					</td>
					<td>
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
			break;
		}
		case 'hosts': {
			const domainSelectOptions = user?.domains.map((d, i) => (
				<option key={`option${i}`} value={d}>{d}</option>
			));
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
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
							{...(handleFieldChange ? { value: editValue.ip || '' } : { defaultValue: '' })}
							onChange={(e) => handleFieldChange && handleFieldChange('ip', e.target.value)}
							name='ip'
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
				</>
			);
			break;
		}
		case 'blockedcc': {
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>
					<td>
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
					<td>
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
			break;
		}
		case 'blockedcn': {
			formElements = (
				<>
					<td>
						{formType === 'add' ? (
							<button className='btn btn-sm btn-success' type='submit'>
								<i className='bi-plus-lg pe-none' width='16' height='16' />
							</button>
						) : (
							<>
								<button className='btn btn-sm btn-success me-2' type='button' onClick={handleSave}>
									<i className='bi-save-fill pe-none' width='16' height='16' />
								</button>
								<button className='btn btn-sm btn-secondary' type='button' onClick={handleCancel}>
									<i className='bi-x-lg pe-none' width='16' height='16' />
								</button>
							</>
						)}
					</td>
					<td>
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
					<td>
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
			break;
		}
		default:
			// should never really get here
			formElements = <td>Unsupported map type</td>;
	}

	return formElements;
};

export default MapFormFields;
