import Link from 'next/link';

export default function RecordSetRow({ domain, name, recordSet }) {

/*
	"a": [
		{ "id": "a", "ttl": 300, "ip": "203.28.238.247", "geok": "cn", "geov": ["OC"], "h": true, "fb": ["b", "c"], "sel": 1, "bsel": 3 },
		{ "id": "b", "ttl": 300, "ip": "38.60.199.224", "geok": "cn", "geov": ["AS"], "h": true, "fb": ["a", "c"], "sel": 1, "bsel": 3 },
		{ "id": "c", "ttl": 300, "ip": "45.88.201.168", "geok": "cn", "geov": ["NA"], "h": true, "fb": ["e", "d"], "sel": 1, "bsel": 3 },
		{ "id": "d", "ttl": 300, "ip": "185.125.168.21", "geok": "cn", "geov": ["EU", "AF"], "h": true, "fb": ["c"], "sel": 1, "bsel": 3 },
		{ "id": "e", "ttl": 300, "ip": "38.54.57.171", "geok": "cn", "geov": ["SA", "AF"], "h": true, "fb": [], "sel": 1, "bsel": 3 }
	],
	"aaaa": [
		{ "id": "a", "ttl": 300, "ip": "2a03:94e0:ffff:185:125:168:0:21", "geok": "cn", "geov": ["EU", "AF"], "h": true, "fb": ["b"], "sel": 1, "bsel": 3 },
		{ "id": "b", "ttl": 300, "ip": "2a03:94e1:ffff:45:88:201:0:168", "geok": "cn", "geov": ["NA", "SA", "AS", "OC"], "h": true, "fb": ["a"], "sel": 1, "bsel": 3 }
	],
	"caa": [
		{ "flag": 0, "tag": "issue", "value": "letsencrypt.org" },
		{ "flag": 0, "tag": "iodef", "value": "mailto:tom@69420.me" }
	],
	"soa": { "ttl": 86400, "minttl": 30, "mbox": "root.basedflare.com.", "ns": "esther.kikeflare.com.", "refresh": 86400, "retry": 7200, "expire": 3600 },
	"txt": [
		{ "ttl": 300, "text": "v=spf1 -all" }
	],
	"ns": [
		{ "ttl": 86400, "host": "esther.kikeflare.com." },
		{ "ttl": 86400, "host": "aronowitz.bfcdn.host." },
		{ "ttl": 86400, "host": "goldberg.fatpeople.lol." }
	]
*/

	const type = recordSet[0]
	const recordSetArray = Array.isArray(recordSet[1]) ? recordSet[1] : [recordSet[1]];
	return (
		<tr className="align-middle">
			<td>
				{name}
			</td>
			<td>
				{type.toUpperCase()}
			</td>
			<td>
				{recordSetArray.map((r, i) => {
					const healthClass = r.h != null
						? (r.h ? "text-success" : "text-danger")
						: "";
					return (<div key={i}>
						<strong>{r.id ? r.id+': ' : ''}</strong>
						<span className={healthClass}>{r.ip || r.host || r.value || r.ns || r.text}</span>
					</div>)
				})}
			</td>
			<td>
				{recordSetArray[0].ttl}
			</td>
			<td>
				{recordSetArray.map((r, i) => (
					<div key={i}>
						{r.geok ? 'Geo: ' : ''}{(r.geov||[]).join(', ')}
					</div>
				))}
			</td>
			<td>
				<Link href={`/dns/${domain}/${name}/${type}`}>
					<a className="btn btn-outline-primary">
						Edit
					</a>
				</Link>
			</td>
		</tr>
	);

}
