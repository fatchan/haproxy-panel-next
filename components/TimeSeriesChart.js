import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
	Legend,
} from 'recharts';

import { useMemo } from 'react';

const colors = {
	'-1': '#ffffff',
	100: '#ffffff',
	101: '#ffffff',
	102: '#ffffff',
	200: '#a5d6a7',
	201: '#66bb6a',
	202: '#388e3c',
	203: '#2e7d32',
	204: '#4caf50',
	206: '#4caf90',
	300: '#64b5f6',
	301: '#2196f3',
	302: '#90caf9',
	304: '#1976d2',
	400: '#ffb74d',
	401: '#ff9800',
	403: '#e65100',
	404: '#f57c00',
	429: '#f57c00',
	500: '#ef5350',
	501: '#d32f2f',
	502: '#c62828',
	503: '#e53935',
	504: '#b71c1c',
	Challenged: 'yellow',
	Passed: 'green',
	'Incoming Traffic': 'pink',
	'Outgoing Traffic': 'orange',
};

const simpleStringToColor = str => {
	const hash = Array.from(str)
		.reduce((h, c) => h + c.charCodeAt(0).toString(16), '')
		.slice(0, 9);
	let color = parseInt(hash, 16);
	let r = (color >> 16) & 0xff;
	let g = (color >> 8) & 0xff;
	let b = color & 0xff;
    //mix with middle grey color to make less saturated
	const blendFactor = 0.6;
	r = Math.floor(r * blendFactor + 127 * (1 - blendFactor));
	g = Math.floor(g * blendFactor + 127 * (1 - blendFactor));
	b = Math.floor(b * blendFactor + 127 * (1 - blendFactor));
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const TimeSeriesChart = ({ data, title, stack = false, fill = true, yLabel, xLabel, formatter }) => {
	const sortedSeriesKeys = Object.keys(data[0])
		.filter(key => key !== 'time')
		.sort((a, b) => a - b);
	const chartKey = useMemo(() => JSON.stringify(data), [data]); //slow?
	return (
		<div className='rounded-border p-3' style={{ backgroundColor: 'var(--bs-body-bg)' }}>
			<p style={{ color: 'var(--bs-body-color)' }}>{title}</p>
			<ResponsiveContainer width='100%' height={400}>
				<AreaChart isAnimationActive={false} key={chartKey} data={data}>
					<XAxis
						label={xLabel?{value:xLabel}:''}
						dataKey='time'
						stroke='var(--bs-body-color)'
						tick={{ fontSize:'12' }}
					/>
					<YAxis
						label={yLabel ? { value: yLabel, angle: -90, offset: 15, position: 'insideLeft' } : ''}
						type='number'
						stroke='var(--bs-body-color)'
						tickFormatter={formatter||null}
						tick={{ fontSize:'12', textAnchor: 'end' }}
					/>
					<Tooltip
						contentStyle={{
							background: 'var(--bs-body-bg)',
							border: '1px solid var(--bs-border-color-translucent)'
						}}
						animationEasing='ease'
						formatter={formatter||null}
					/>
					<CartesianGrid strokeDasharray='3 3' stroke='var(--bs-border-color-translucent)' />
					{sortedSeriesKeys.map(series => (
						<Area
							isAnimationActive={false}
							key={series}
							type='linear'
							dataKey={series}
							stroke={colors[series] || simpleStringToColor(series)}
							fill={fill ? (colors[series] || simpleStringToColor(series)) : '#ffffff20'}
							stackId={stack ? 'a' : undefined}
						/>
					))}
					<Legend />
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
};

export default TimeSeriesChart;
