import 'dotenv/config';

import * as redis from './redis.js';
import * as db from './db.js';
import * as semver from 'semver';
import packageJson from './package.json' with { type: 'json' };
import loadMigrations from './migrations/index.js';

(async () => {

  const version = packageJson.version;
  const migrations = await loadMigrations();
  await db.connect();

  //get current version from db if present
  let currentVersion = await db.db().collection('version').findOne({
    '_id': 'version'
  }).then(res => res ? res.version : '0.0.0'); // 0.0.0 for pre-migration versions

  console.log(`[migrate] Current version: ${currentVersion}`);
  console.log(`[migrate] Package version: ${version}`);

  if (semver.lt(currentVersion, version)) {
    const migrationVersions = Object.keys(migrations)
      .sort(semver.compare)
      .filter(v => semver.gt(v, currentVersion));
    console.log(`[migrate] Migrations needed: ${currentVersion} -> ${migrationVersions.join(' -> ')}`);
    for (let ver of migrationVersions) {
      console.log(`[migrate] Starting migration to version ${ver}`);
      try {
        await migrations[ver](db, redis);
        await db.db().collection('version').replaceOne({
          '_id': 'version'
        }, {
          '_id': 'version',
          'version': ver
        }, {
          upsert: true
        });
      } catch (e) {
        console.error(e);
        console.warn(`[migrate] Migration to ${ver} encountered an error`);
        process.exit(1);
      }
      console.log(`[migrate] Finished migrating to version ${ver}`);
    }
  } else {
    console.log(`[migrate] Migration not required, you are already on version (${version})`);
  }

  process.exit(1);

})()

