// Read-only preflight. Source snapshots stay ignored; reports contain no raw settings.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { sheetSources, requiredColumns } from '../src/shared/config/data-sources.ts';
import { parseCsv } from '../src/shared/domain/csv.ts';
import { isActive, normalizeId } from '../src/shared/domain/offers.ts';
import { getCatalog } from '../src/shared/data/catalog.mjs';
import { normalizeSheetRows } from '../src/shared/data/sheet-rows.mjs';
import { finalPrice } from '../src/shared/domain/prices.ts';

const local = new URL('../supabase/local/', import.meta.url);
const reports = new URL('../qa/supabase/', import.meta.url);
await mkdir(local, { recursive: true });
await mkdir(reports, { recursive: true });
const sources = {};
const manifest = {};
for (const [name, url] of Object.entries(sheetSources)) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`[${name}] HTTP ${response.status}`);
  const csv = await response.text();
  if (/^\s*</.test(csv)) throw new Error(`[${name}] Expected CSV, received HTML.`);
  const rows = parseCsv(csv, name);
  if (!rows.length) throw new Error(`[${name}] No data rows.`);
  for (const key of requiredColumns[name]) {
    if (!Object.hasOwn(rows[0], key)) throw new Error(`[${name}] Missing column ${key}.`);
  }
  sources[name] = rows;
  await writeFile(new URL(`${name}.csv`, local), csv);
  manifest[name] = {
    sha256: createHash('sha256').update(csv).digest('hex'),
    rows: rows.length,
    activeRows: rows.filter(row => isActive(row.is_active)).length,
  };
}

// Validate the current catalog's IDs, translations, image links, package relations,
// addons and settings against this exact snapshot; never substitute stale data.
const catalog = await getCatalog({ read: async name => normalizeSheetRows(name, sources[name]) });
const issues = [];
const blankChildDefaults = [];
const blankMinPaxDefaults = [];
const placeholders = {};
const adultBaseSelections = [];
for (const [name, idField] of [['Trips_Prices', 'trip_id'], ['Packages', 'package_id']]) {
  placeholders[name] = 0;
  for (const [index, row] of sources[name].entries()) {
    if (!row[idField] && !isActive(row.is_active)) {
      placeholders[name]++;
      continue;
    }
    const id = normalizeId(row[idField] || '');
    const context = { source: name, row: index + 2, id, active: isActive(row.is_active) };
    for (const [kind, allowFree] of [['adult', false], ['child', true]]) {
      try { finalPrice(row[`p_${kind}`], row[`d_${kind}`], `${name}:${id}:${kind}_price`, allowFree); }
      catch (error) { issues.push({ ...context, field: `${kind}_price`, reason: error.message }); }
    }
    if (!row.d_adult && row.p_adult) adultBaseSelections.push({ ...context, adult_price: row.p_adult });
    if (!row.d_child && !row.p_child) blankChildDefaults.push(context);
    if (!row.min_pax) blankMinPaxDefaults.push(context);
    else if (!/^\d+$/.test(row.min_pax) || !Number.isSafeInteger(Number(row.min_pax)) || Number(row.min_pax) < 1) {
      issues.push({ ...context, field: 'min_pax', value: row.min_pax, reason: 'Expected a positive integer' });
    }
  }
}
const report = {
  capturedAt: new Date().toISOString(),
  status: issues.length ? 'blocked' : 'price-preflight-passed',
  scope: 'Existing four Sheets sources only; no new business features or Auth.',
  remoteWrites: false,
  acceptedImportProduced: false,
  catalog: {
    publishedTrips: catalog.trips.length, publishedPackages: catalog.packages.length,
    publishedAddons: catalog.addons.length, sourceSettings: catalog.settings.length,
    packageTripRelations: catalog.packages.reduce((count, item) => count + item.includedTripIds.length, 0),
  },
  sources: manifest,
  inactiveRowsWithoutIds: placeholders,
  pricePolicy: 'Nonblank d wins including zero; blank d uses p. Both child cells blank -> zero. Both adult cells blank -> failure.',
  adultBaseSelections, blankChildDefaults, blankMinPaxDefaults,
  publicSettingAllowlist: ['promo_banner'],
  settingsExcludedFromPromoCatalog: sources.Global_Settings.filter(row => row.key !== 'promo_banner').map(row => row.key),
  issues,
};
await writeFile(new URL('sheets-preflight.json', reports), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(new URL('manifest.json', local), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Snapshot: ${fileURLToPath(local)} (ignored by Git)`);
console.log(`Catalog: ${JSON.stringify(report.catalog)}`);
console.log(`Legacy catalog validation: passed (IDs, translations, images, package relations, addons/settings)`);
for (const issue of issues) console.error(`[${issue.source}:${issue.id}] row ${issue.row}, ${issue.field}: ${issue.reason}.`);
console.log(`Single-price preflight: ${report.status}; ${issues.length} issue(s). No accepted import or remote writes.`);
process.exitCode = issues.length ? 1 : 0;
