import assert from 'node:assert/strict';
import { test } from 'node:test';
import it from '../../data/content/it.json' with { type: 'json' };
import en from '../../data/content/en.json' with { type: 'json' };
import tourIt from '../../../tours/data/content/it.json' with { type: 'json' };
import tourEn from '../../../tours/data/content/en.json' with { type: 'json' };
import { fixtureRows } from '../../../../../qa/data/fixtures.mjs';
import { mapTrips } from '../../../tours/domain/tours.ts';
import { mapPackages } from '../packages.ts';
const trips = mapTrips(fixtureRows('Trips_Prices'), { it: tourIt, en: tourEn }, ['it', 'en']);
const map = rows => mapPackages(rows, trips, { it, en }, ['it', 'en']);
test('all active packages preserve included trips and empty standalone packages', () => {
  const packages = map(fixtureRows('Packages'));
  assert.equal(packages.length, 14);
  assert.equal(packages[0].includedTripIds.length, 5);
  assert.deepEqual(packages.find(p => p.id === 'cairo_crociera_nilo_cena').includedTripIds, []);
});
test('package blank child price and min_pax preserve zero and one', () => {
  const pkg = map(fixtureRows('Packages')).find(p => p.id === 'cairo_crociera_nilo_cena');
  assert.equal(pkg.prices.child, 0); assert.equal(pkg.minPax, 1);
});
test('unknown and duplicate included-trip IDs fail with package context', () => {
  const data = fixtureRows('Packages'); data[0].included_trip_ids = 'unknown';
  assert.throws(() => map(data), /sharm_confidential.*Unknown included trip unknown/);
  data[0].included_trip_ids = `${trips[0].id},${trips[0].id}`;
  assert.throws(() => map(data), /Duplicate included trip/);
});
