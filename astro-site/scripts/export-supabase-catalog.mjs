// Local preparation only. Run the read-only Sheets audit first to refresh snapshots.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/shared/domain/csv.ts';
import { isActive } from '../src/shared/domain/offers.ts';
import { normalizeSheetRows } from '../src/shared/data/sheet-rows.mjs';
import { getCatalog } from '../src/shared/data/catalog.mjs';
import { createCatalogImport, importColumns } from '../src/shared/data/catalog-import.mjs';

const root = new URL('../supabase/', import.meta.url);
const local = new URL('local/', root);
const destination = new URL('import/', root);
await mkdir(destination, { recursive: true });
// A failed run must not leave an accepted manifest pointing at an earlier export.
await rm(new URL('manifest.json', destination), { force: true });
const hashes = JSON.parse(await readFile(new URL('manifest.json', local), 'utf8'));
const sources = {};
for (const name of ['Trips_Prices','Packages','Trip_Addons','Global_Settings']) {
  const body = await readFile(new URL(`${name}.csv`, local), 'utf8');
  const hash = createHash('sha256').update(body).digest('hex');
  assert.equal(hash, hashes[name].sha256, `[${name}] Snapshot checksum mismatch; rerun the audit.`);
  sources[name] = parseCsv(body, name);
}
const normalized = Object.fromEntries(Object.entries(sources).map(([name, rows])=>[name,normalizeSheetRows(name,rows)]));
const catalog = await getCatalog({ read: async name=>normalized[name] });
const tables = createCatalogImport(normalized);
const csv = (columns, rows) => `${columns.join(',')}\n${rows.map(row=>columns.map(key=>{
  const value=String(row[key]);
  return !value || /[",\r\n]/.test(value)?`"${value.replaceAll('"','""')}"`:value;
}).join(',')).join('\n')}\n`;
const manifest = {
  generatedAt: new Date().toISOString(), status: 'ready-for-user-review', remoteApplied: false,
  project: 'iiivnvwspoikfrlclhyr', sources: hashes,
  schemaSha256: createHash('sha256').update(await readFile(new URL('schema.sql',root))).digest('hex'),
  pricePolicy: 'Nonblank d wins including zero; blank d uses p. Both child cells blank -> zero. Both adult cells blank -> failure.',
  validatedPublishedCatalog: { trips:catalog.trips.length, packages:catalog.packages.length, addons:catalog.addons.length },
  excluded: {
    inactiveTripPlaceholders: sources.Trips_Prices.filter(row=>!row.trip_id&&!isActive(row.is_active)).length,
    inactivePackagePlaceholders: sources.Packages.filter(row=>!row.package_id&&!isActive(row.is_active)).length,
    settingsOutsidePromoAllowlist: sources.Global_Settings.filter(row=>row.key!=='promo_banner').map(row=>row.key),
  },
  files: {},
};
for (const [name, rows] of Object.entries(tables)) {
  const body = csv(importColumns[name], rows);
  // Round-trip every field through the existing CSV reader before accepting it.
  assert.deepEqual(parseCsv(body,name),rows.map(row=>Object.fromEntries(importColumns[name].map(key=>[key,String(row[key])]))));
  await writeFile(new URL(`${name}.csv`,destination),body);
  manifest.files[name] = { rows:rows.length, sha256:createHash('sha256').update(body).digest('hex') };
}
await writeFile(new URL('manifest.json',destination),`${JSON.stringify(manifest,null,2)}\n`);
console.log(`Validated complete published catalog: ${catalog.trips.length} trips, ${catalog.packages.length} packages, ${catalog.addons.length} addons.`);
for (const [name, info] of Object.entries(manifest.files)) console.log(`${name}.csv: ${info.rows} rows; sha256 ${info.sha256}`);
console.log('Reviewed CSV preparation only: no remote writes, no accepted schema deployment, no provider switch.');
