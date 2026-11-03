import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixtureRows } from '../../../../qa/data/fixtures.mjs';
import { createCatalogImport, importColumns } from '../catalog-import.mjs';
const sources=()=>Object.fromEntries(['Trips_Prices','Packages','Trip_Addons','Global_Settings'].map(name=>[name,fixtureRows(name)]));

test('existing records export with final prices, exact source order and explicit package membership',()=>{
  const tables=createCatalogImport(sources());
  assert.equal(tables.trips.length,27);assert.equal(tables.trips.filter(row=>row.is_active).length,22);
  assert.equal(tables.packages.length,14);assert.equal(tables.package_trips.length,20);assert.equal(tables.trip_addons.length,3);
  assert.equal(tables.trips[0].adult_price,'40');assert.equal(tables.trips[0].child_price,'19.5');
  assert.equal(tables.trips.find(row=>row.id==='dolphin_show_family').adult_price,'25');
  assert.equal(tables.trips[0].source_order,0);assert.equal(tables.trips[26].source_order,26);
  assert.deepEqual(tables.package_trips.filter(row=>row.package_id==='sharm_confidential').map(row=>row.position),[0,1,2,3,4]);
  for(const [name,rows]of Object.entries(tables))for(const row of rows)assert.deepEqual(Object.keys(row).sort(),[...importColumns[name]].sort());
});
test('promo-only settings retain activation and original dates without publishing unrelated settings',()=>{
  const tables=createCatalogImport(sources());
  assert.deepEqual(tables.public_settings.map(row=>row.key),['promo_banner']);
  assert.equal(tables.public_settings[0].is_active,true);
  assert.equal(tables.public_settings[0].start_date,'2025-12-20 0:00');
  assert.equal(tables.public_settings[0].end_date,'2026-01-01 0:00');
});
test('invalid amounts, rounding, duplicate IDs, unknown relations and ambiguous addon keys fail',()=>{
  let data=sources();data.Trips_Prices[0].adult_price='1.999';assert.throws(()=>createCatalogImport(data),/trips:ras_mohammed_white_island_vip.*adult_price.*exactly/);
  data=sources();data.Trips_Prices[0].adult_price='NaN';assert.throws(()=>createCatalogImport(data),/Invalid adult_price/);
  data=sources();data.Trips_Prices.push({...data.Trips_Prices[0]});assert.throws(()=>createCatalogImport(data),/Duplicate ID\/slug/);
  data=sources();data.Packages[0].included_trip_ids='unknown';assert.throws(()=>createCatalogImport(data),/sharm_confidential.*Unknown trip_id/);
  data=sources();data.Trip_Addons.push({...data.Trip_Addons[0]});assert.throws(()=>createCatalogImport(data),/Duplicate addon ID/);
});
test('database integer and boolean constraints are checked before export',()=>{
  let data=sources();data.Trips_Prices[0].min_pax='0';assert.throws(()=>createCatalogImport(data),/min_pax/);
  data=sources();data.Trips_Prices[0].featured='yes';assert.throws(()=>createCatalogImport(data),/featured.*Invalid boolean/);
});
