import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import { createGoogleSheetsProvider } from '../google-sheets.mjs';
import { getCatalog } from '../catalog.mjs';
import { assertCatalogAssets } from '../catalog-assets.mjs';
import { fixtureText, fixtureProvider } from '../../../../qa/data/fixtures.mjs';
test('a provider fetches once per source in a build and reset fetches fresh data', async () => {
  let calls = 0;
  const provider = createGoogleSheetsProvider({ fetchImpl: async () => { calls++; return new Response(fixtureText('Trips_Prices')); } });
  await Promise.all([provider.read('Trips_Prices'), provider.read('Trips_Prices')]);
  assert.equal(calls, 1); provider.reset(); await provider.read('Trips_Prices'); assert.equal(calls, 2);
});
test('HTTP failure has source context and does not become a cached empty result', async () => {
  let calls = 0;
  const provider = createGoogleSheetsProvider({ fetchImpl: async () => ++calls === 1 ? new Response('', { status: 503 }) : new Response(fixtureText('Trips_Prices')) });
  await assert.rejects(provider.read('Trips_Prices'), /Google Sheets:Trips_Prices.*HTTP 503/);
  assert.equal((await provider.read('Trips_Prices')).length, 100);
});
test('HTML, malformed CSV schema, and timeout errors are explicit failures', async () => {
  for (const [body, message] of [['<html>error</html>', /HTML instead of CSV/], ['wrong\nvalue', /Missing CSV column trip_id/]]) {
    const provider = createGoogleSheetsProvider({ fetchImpl: async () => new Response(body) });
    await assert.rejects(provider.read('Trips_Prices'), message);
  }
  const provider = createGoogleSheetsProvider({ fetchImpl: async () => { throw new DOMException('Request timed out', 'TimeoutError'); } });
  await assert.rejects(provider.read('Trips_Prices'), /Google Sheets:Trips_Prices.*timed out/);
});
test('the provider can be replaced without changing feature models or access functions', async () => {
  const catalog = await getCatalog(fixtureProvider());
  assert.equal(catalog.trips.length, 22); assert.equal(catalog.packages.length, 14); assert.equal(catalog.addons.length, 3);
});
test('every mapped price and minimum matches the real legacy booking function', async () => {
  const source = fs.readFileSync(new URL('../../../../../assets/js/modules/booking-manager.js', import.meta.url), 'utf8');
  const context = { window: {}, document: { addEventListener() {} } };
  vm.createContext(context); vm.runInContext(source, context);
  const catalog = await getCatalog(fixtureProvider());
  for (const offer of [...catalog.trips, ...catalog.packages]) {
    const old = context.window.BookingManager.utils.getPrices(offer.source);
    assert.deepEqual({ adult: offer.prices.adult, child: offer.prices.child, minPax: offer.minPax }, JSON.parse(JSON.stringify(old)), offer.id);
  }
});
test('missing linked image files fail with record context', () => {
  assert.throws(() => assertCatalogAssets([{ id: 'test', poster: '/src/shared/assets/catalog/missing.webp' }]), /catalog:test.*Missing linked poster/);
});
