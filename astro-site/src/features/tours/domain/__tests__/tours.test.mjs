import assert from 'node:assert/strict';
import { test } from 'node:test';
import it from '../../data/content/it.json' with { type: 'json' };
import en from '../../data/content/en.json' with { type: 'json' };
import { fixtureRows } from '../../../../../qa/data/fixtures.mjs';
import { mapTrips } from '../tours.ts';
import { assertUniqueSlugs, normalizeId } from '../../../../shared/domain/offers.ts';
const dictionaries = { it, en }, locales = ['it', 'en'];
const rows = () => fixtureRows('Trips_Prices');
test('active source records map without publishing dummy or blank inactive rows', () => {
  const trips = mapTrips(rows(), dictionaries, locales);
  assert.equal(trips.length, 22);
  assert.ok(trips.every(trip => trip.id && !trip.id.endsWith('_dummy')));
  assert.equal(trips[0].id, 'ras_mohammed_white_island_vip');
  assert.equal(trips[0].slug, trips[0].id);
});
test('blank child prices and minimum travelers keep the legacy defaults', () => {
  const trip = mapTrips(rows(), dictionaries, locales).find(trip => trip.id === 'sharm_old_market_ultimate_shopping');
  assert.equal(trip.prices.child, 0); assert.equal(trip.minPax, 1);
  assert.equal(trip.source.p_child, ''); assert.equal(trip.source.min_pax, '');
});
test('existing zero discount values remain zero for booking, not a new policy', () => {
  const data = rows(); data[0].adult_price = '0'; data[0].child_price = '0';
  const trip = mapTrips(data, dictionaries, locales)[0];
  assert.equal(trip.prices.adult, 0); assert.equal(trip.prices.child, 0);
});
test('missing adult price fails instead of creating a price', () => {
  const data = rows(); data[0].adult_price = '';
  assert.throws(() => mapTrips(data, dictionaries, locales), /ras_mohammed_white_island_vip.*adult_price/);
});
test('invalid numeric price and minimum travelers fail', () => {
  const data = rows(); data[0].adult_price = '45EUR';
  assert.throws(() => mapTrips(data, dictionaries, locales), /Invalid adult_price/);
  data[0].adult_price = '45'; data[0].min_pax = '1.5';
  assert.throws(() => mapTrips(data, dictionaries, locales), /non-negative integer/);
});
test('an explicitly supplied zero minimum is retained as in legacy booking', () => {
  const data = rows(); data[0].min_pax = '0';
  assert.equal(mapTrips(data, dictionaries, locales)[0].minPax, 0);
});
test('duplicate IDs and slugs fail rather than overwrite records', () => {
  const data = rows(); data.push({ ...data[0] });
  assert.throws(() => mapTrips(data, dictionaries, locales), /Duplicate trip_id/);
  const trips = mapTrips(rows(), dictionaries, locales);
  assert.throws(() => assertUniqueSlugs([trips[0], { ...trips[1], slug: trips[0].slug }], 'Trips'), /Duplicate slug/);
});
test('a missing translation identifies the locale and ID', () => {
  assert.throws(() => mapTrips(rows(), { it, en: {} }, locales), /ras_mohammed_white_island_vip.*en/);
});
test('only the existing legacy aliases normalize stable IDs', () => {
  assert.equal(normalizeId('yacht_white'), 'ras_mohammed_white_island_vip');
  assert.equal(normalizeId('cairo_pyramids_classic_dummy'), 'cairo_pyramids_classic_dummy');
});
