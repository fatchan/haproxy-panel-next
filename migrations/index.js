import fs from 'node:fs';
import path from 'node:path';
import semver from 'semver';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function run(dir = __dirname) {
	const files = fs.readdirSync(dir);
	const map = {};
	await Promise.all(files.map(async (file) => {
		const name = file.substring(0, file.length - 3);
		if (!semver.valid(name)) { return; }
		const modulePath = path.join(dir, file);
		const url = new URL(`file://${modulePath}`);
		const mod = await import(url.href);
		return map[name] = mod.default ?? mod;
	}));
	const migrationKeys = Object.keys(map);
	console.log(`[migrate] Loaded ${migrationKeys.length} migrations: [${migrationKeys.join(',')}]`);
	return map;
}
