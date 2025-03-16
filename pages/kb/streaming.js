import Head from 'next/head';
import Link from 'next/link';
import { continentMap } from '../../lib/misc/continents.js';

export default function StreamingKnowledgebase() {

	return (
		<>
			<Head>
				<title>Streaming URLs</title>
			</Head>

			<h4 className='fw-bold'>
				Streaming URL Formats:
			</h4>

			<hr />

			<p>
				This article provides an overview of the various streaming URL formats used for input and output in our streaming setup.
			</p>

			<hr />

			<h5 className='fw-bold'>Input URL Format</h5>
			<p>
				The input URL format for streaming is as follows:
			</p>
			<div>
				<code>rtmp://{process.env.NEXT_PUBLIC_OME_ORIGIN_HOSTNAME}/app/{'<Account Stream ID>'}+{'<Stream Key Name>'}?key={'<Stream Key>'}</code>
			</div>
			<p>
				Replace <code>{'<Account Stream ID>'}</code>, <code>{'<Stream Key Name>'}</code> and <code>{'<Stream Key>'}</code>. These are all available on the <Link href='/streams'>Live Streaming</Link> page.
			</p>

			<hr />

			<h5 className='fw-bold'>Output URL Formats</h5>
			<p>
				There are several output URL formats available for streaming:
			</p>

			<ul>
				<li>
					<strong>Low Latency HLS:</strong>
					<div>
						<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME}/app/{'<Account Stream ID>'}+{'<Stream Key Name>'}/llhls.m3u8</code>
					</div>
				</li>
				<li>
					<strong>HLS (backup/alternative for viewers with poor connections):</strong>
					<div>
						<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME}/hls/app/{'<Account Stream ID>'}+{'<Stream Key Name>'}/ts:playlist.m3u8</code>
					</div>
				</li>
				<li>
					<strong>Thumbnails:</strong>
					<div>
						<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME}/thumb/app/{'<Account Stream ID>'}+{'<Stream Key Name>'}/thumb.{'<'}png|jpg{'>'}</code>
					</div>
				</li>
			</ul>

			<hr />

			<h5 className='fw-bold'>Important Note</h5>
			<p>
				<div className='text-danger fw-bold'>
					<p>Note: "stream-global" URLs will only redirect to a regional endpoint and will NOT work for playback. Playback will only work from regional endpoints.</p>
					<p>The regional endpoints (based on continent) are:</p>
					<ul>
						{Object.keys(continentMap)
							.filter(cn => cn != 'XX')
							.map((cn, i) => (<li key={i}>{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME.replace('-global', cn.toLowerCase())}</li>))}
					</ul>
				</div>
			</p>

			<small>Last Updated: March 16, 2025</small>

		</>
	);
}
