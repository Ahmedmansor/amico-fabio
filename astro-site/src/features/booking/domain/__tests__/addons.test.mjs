import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixtureRows } from '../../../../../qa/data/fixtures.mjs';
import { mapAddons } from '../addons.ts';
const parents = ['ras_mohammed_white_island_vip', 'tiran_island_boat_vip'];
test('real addon labels and prices are preserved in both languages', () => {
  const addons = mapAddons(fixtureRows('Trip_Addons'), parents, ['it', 'en']);
  assert.equal(addons.length, 3); assert.equal(addons[0].price, 15);
  assert.equal(addons[0].labels.it, 'Immersione con bombole');
  assert.equal(addons[0].labels.en, 'Scuba Diving Option');
});
test('unknown parents and duplicate addons within a parent fail', () => {
  const data = fixtureRows('Trip_Addons');
  assert.throws(() => mapAddons(data, [], ['it', 'en']), /Unknown trip\/package/);
  assert.throws(() => mapAddons([...data, data[0]], parents, ['it', 'en']), /Duplicate addon ID/);
});
test('negative prices and missing translated labels fail', () => {
  const data = fixtureRows('Trip_Addons'); data[0].price = '-1';
  assert.throws(() => mapAddons(data, parents, ['it', 'en']), /Invalid price/);
  data[0].price = '15'; data[0].label_en = '';
  assert.throws(() => mapAddons(data, parents, ['it', 'en']), /label_en/);
});
