import Head from 'next/head';

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
				<code>rtmp://{process.env.NEXT_PUBLIC_OME_ORIGIN_HOSTNAME}/app/{'<streamsId>'}+{'<Stream Key Name>'}?key={'<Stream Key>'}</code>
			</div>
			<p>
				Replace <code>{'<Stream Key Name>'}</code> and <code>{'<Stream Key>'}</code> with your specific stream key details. This information can be found on your account page, and the specific streamer ID and app names are configured on the streams page.
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
						<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME}/app/{'<streamsId>'}+{'<Stream Key Name>'}/llhls.m3u8</code>
					</div>
				</li>
				<li>
					<strong>HLS (Not recommended):</strong>
					<div>
						<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME}/hls/app/{'<streamsId>'}+{'<Stream Key Name>'}/ts:playlist.m3u8</code>
					</div>
				</li>
				<li>
					<strong>Thumbnails:</strong>
					<div>
						<code>https://{process.env.NEXT_PUBLIC_OME_EDGE_HOSTNAME}/thumb/app/{'<streamsId>'}+{'<Stream Key Name>'}/thumb.{'<'}png|jpg{'>'}</code>
					</div>
				</li>
			</ul>

			<hr />

			<h5 className='fw-bold'>Important Note</h5>
			<p>
				<div className='text-danger fw-bold'>
					Note: these are global URLs and will redirect to a regional endpoint. Streaming will only work from regional endpoints, not the global URL.
				</div>
			</p>

			<small>Last Updated: March 14, 2025</small>

		</>
	);
}
