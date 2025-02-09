import Image from 'next/image';
let ResolvedImage = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import BackButton from '../components/BackButton.js';
import ErrorAlert from '../components/ErrorAlert.js';
import SearchFilter from '../components/SearchFilter.js';
import SuccessAlert from '../components/SuccessAlert.js';
import InfoAlert from '../components/InfoAlert.js';
import CopyButton from '../components/CopyButton.js';
import * as API from '../api.js';
import { useRouter } from 'next/router';
import withAuth from '../components/withAuth.js';

const SecretString = ({ text }) => {
	const [isVisible, setIsVisible] = useState(false);

	const toggleVisibility = () => {
		setIsVisible((prev) => !prev);
	};

	return (
		<div className='d-flex align-items-center'>
			<CopyButton text={text} />
			<button onClick={toggleVisibility} className='btn btn-light me-2'>
				<i className={`bi mr-2 bi-${isVisible ? 'eye-fill' : 'eye-slash-fill'}`} />
			</button>
			<span className='me-2'>
				<code>{isVisible ? text : '*'.repeat(text.length)}</code>
			</span>
		</div>
	);
};

function Streams(props) {

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const [filter, setFilter] = useState('');
	const [continent, setContinent] = useState(props?.user?.cc || 'global');

	useEffect(() => {
		if (!state.user || !state.user.domains || state.streams == null) {
			API.getStreams(dispatch, setError, router);
		}
	}, []);

	if (!state.user || state.user.domains == null || state.streams == null) {
		return (
			<div className='d-flex flex-column'>
				{error && <ErrorAlert error={error} />}
				<div className='text-center mb-4'>
					<div className='spinner-border mt-5' role='status'>
						<span className='visually-hidden'>Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	const { csrf, streamKeys, streams, user } = state;

	async function addStream(e) {
		e.preventDefault();
		setError(null);
		await API.addStream({ _csrf: csrf, appName: e.target.appName.value }, () => {
			API.getStreams(dispatch, setError, router);
		}, setError, router);
		e.target.reset();
	}

	async function concludeStream(csrf, appName) {
		setError(null);
		await API.concludeStream({ _csrf: csrf, appName }, () => {
			API.getStreams(dispatch, setError, router);
		}, setError, router);
	}

	async function deleteStream(csrf, id) {
		setError(null);
		await API.deleteStream({ _csrf: csrf, id }, () => {
			API.getStreams(dispatch, setError, router);
		}, setError, router);
	}

	const streamsTable = streams
		// .sort((a, b) => a.localeCompare(b))
		.filter(s => (!filter || filter.length === 0) || (s && s.includes(filter)))
		.map(s => (
			<tr key={`stream_${s}`} className='align-middle'>
				<td className='text-left' style={{ width: 0 }}>
					<a className='btn btn-sm btn-danger' onClick={() => concludeStream(csrf, s)}>
						<i className='bi-trash-fill pe-none' width='16' height='16' />
					</a>
				</td>
				<td>
					<a
						target='_blank'
						rel='noreferrer'
						href={`https://demo.ovenplayer.com/#%7B%22playerOption%22%3A%7B%22autoStart%22%3Atrue%2C%22autoFallback%22%3Atrue%2C%22mute%22%3Afalse%2C%22sources%22%3A%5B%7B%22type%22%3A%22ll-hls%22%2C%22file%22%3A%22https%3A%2F%2Fstream-${continent}.bfcdn.host%2F${encodeURI(s)}%2Fllhls.m3u8%22%7D%5D%2C%22doubleTapToSeek%22%3Afalse%7D%2C%22demoOption%22%3A%7B%22autoReload%22%3Atrue%2C%22autoReloadInterval%22%3A2000%7D%7D`}
					>
						<ResolvedImage
							src={`https://${process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME}/thumb/${s}/thumb.jpg`}
							width={160}
							height={90}
							unoptimized
						/>
					</a>
				</td>
				<td>
					{s.substring(s.indexOf('+') + 1)}
				</td>
				<td>
					<div className='d-flex align-items-center'>
						<CopyButton text={`https://${process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME.replace('-global', `-${continent}`)}/${s}/llhls.m3u8`}/>
						<a
							target='_blank'
							rel='noreferrer'
							href={`https://${process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME.replace('-global', `-${continent}`)}/${s}/llhls.m3u8`}
						>
							{`https://${process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME.replace('-global', `-${continent}`)}/${s}/llhls.m3u8`}
						</a>
					</div>
				</td>
			</tr>
		));

	const streamKeysTable = streamKeys
		// .sort((a, b) => a.localeCompare(b))
		.filter(s => (!filter || filter.length === 0) || (s.appName && s.appName.includes(filter)))
		.map(s => (
			<tr key={`stream_${s.appName}`} className='align-middle'>
				<td className='text-left' style={{ width: 0 }}>
					<a className='btn btn-sm btn-danger' onClick={() => deleteStream(csrf, s._id)}>
						<i className='bi-trash-fill pe-none' width='16' height='16' />
					</a>
				</td>
				<td>
					{s.appName}
				</td>
				<td suppressHydrationWarning={true}>
					{new Date(s.dateCreated).toLocaleString()}
				</td>
				<td>
					<SecretString text={s.streamKey} />
				</td>
			</tr>
		));

	return (
		<>

			<Head>
				<title>Stream Keys</title>
			</Head>

			<SearchFilter filter={filter} setFilter={setFilter} />

			<div className='input-group mb-3'>
				<span className='input-group-text'>Region</span>
  			<select className='form-select' value={continent} onChange={e => {
  				setContinent(e.target.value);
 			}}>
					<option value='NA'>North America</option>
					<option value='EU'>Europe</option>
					<option value='OC'>Oceania</option>
					<option value='AS'>Asia</option>
					<option value='SA'>South America</option>
					<option value='AF'>Africa</option>
					<option value='global'>Global</option>
				</select>
			</div>

			<InfoAlert>
				Stream input URL format:
				<div><code>rtmp://{process.env.NEXT_PUBLIC_OME_ORIGIN_HOSTNAME}/app/{user.streamsId}+{'<Stream Key Name>'}?key={'<Stream Key>'}</code></div>
			</InfoAlert>

			<SuccessAlert>
				Stream output URL format:
				<div>Low Latency HLS:{' '}<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME.replace('-global', `-${continent}`)}/app/{user.streamsId}+{'<Stream Key Name>'}/llhls.m3u8</code></div>
				<div>HLS (Not recommended):{' '}<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME.replace('-global', `-${continent}`)}/hls/app/{user.streamsId}+{'<Stream Key Name>'}/ts:playlist.m3u8</code></div>
				<div>Thumbnails:{' '}<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME.replace('-global', `-${continent}`)}/thumb/app/{user.streamsId}+{'<Stream Key Name>'}/thumb.{'<'}png|jpg{'>'}</code></div>
				{continent === 'global' && <div className='text-danger fw-bold'>Note: these are global URLs and will redirect to a regional endpoint. Streaming will only work from regional endpoints, not the global URL.</div>}
			</SuccessAlert>

			<h5 className='fw-bold'>
				Live Streams:
			</h5>

			{/* Streams table */}
			<div className='table-responsive round-border mb-2'>
				<table className='table text-nowrap'>
					<tbody>

						<tr className='align-middle'>
							<th />
							<th>
								Thumbnail
							</th>
							<th>
								Key Name
							</th>
							<th>
								Playlist Link
							</th>
						</tr>

						{streamsTable}

					</tbody>
				</table>
			</div>

			<hr />

			<h5 className='fw-bold'>
				Stream Keys:
			</h5>

			{/* Streams table */}
			<div className='table-responsive round-border'>
				<table className='table text-nowrap'>
					<tbody>

						<tr className='align-middle'>
							<th />
							<th>
								Key Name
							</th>
							<th>
								Date Created
							</th>
							<th>
								Stream Key
							</th>
						</tr>

						{streamKeysTable}

						{/* Add new stream form */}
						<tr className='align-middle'>
							<td className='col-1 text-center' colSpan='5'>
								<form className='d-flex' onSubmit={addStream} action='/forms/stream/add' method='post'>
									<input type='hidden' name='_csrf' value={csrf} />
									<button className='btn btn-sm btn-success' type='submit'>
										<i className='bi-plus-lg pe-none' width='16' height='16' />
									</button>
									<input className='form-control ms-3' type='text' name='appName' placeholder='key name' required />
								</form>
							</td>
						</tr>

					</tbody>
				</table>
			</div>

			{error && <span className='mx-2'><ErrorAlert error={error} /></span>}

			{/* back to account */}
			<BackButton to='/dashboard' />

		</>
	);

}

export async function getServerSideProps({ _req, res, _query, _resolvedUrl, _locale, _locales, _defaultLocale }) {
	return { props: JSON.parse(JSON.stringify(res.locals.data || {})) };
}

export default withAuth(Streams);
