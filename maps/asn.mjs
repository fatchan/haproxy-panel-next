import { readFileSync, writeFileSync } from 'fs';

const data = readFileSync('./asn.map', { encoding: 'utf8', flag: 'r' });
const lines = data.split('\n');
const asnMap = lines.reduce((acc, line) => {
	const split = line.split(',');
	const asn = split.shift();
	let name = split.join(',');
	if (name.startsWith('"')) {
		name = name
			.substring(1, name.length-1)
			.replaceAll('""', '"');
	}
	acc[asn] = name;
	return acc;
}, {});

writeFileSync('./asn.json', JSON.stringify(asnMap, null, '\t'));
