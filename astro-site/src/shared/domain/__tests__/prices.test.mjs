import assert from 'node:assert/strict';
import { test } from 'node:test';
import { finalPrice } from '../prices.ts';
import { normalizeSheetRows } from '../../data/sheet-rows.mjs';

test('a supplied final amount wins; blank final uses base; explicit zero is preserved', () => {
  assert.equal(finalPrice('50', '40', 'test'), 40);
  assert.equal(finalPrice('50', '  ', 'test'), 50);
  assert.equal(finalPrice('50', '0', 'test'), 0);
  assert.equal(finalPrice('0', '', 'test'), 0);
  assert.equal(finalPrice('', '15.50', 'test'), 15.5);
});
test('missing adult prices fail; child defaults to zero only when both inputs are blank', () => {
  assert.throws(() => finalPrice('', '', 'trip:test:adult_price'), /trip:test:adult_price.*Missing required price/);
  assert.equal(finalPrice('', '', 'child', true), 0);
  assert.equal(finalPrice('12', '', 'child', true), 12);
});
test('invalid selected amounts fail without falling back to another value', () => {
  for (const value of ['invalid', '-1', 'NaN', 'Infinity', '12EUR']) {
    assert.throws(() => finalPrice('40', value, 'record:price'), /record:price.*Invalid price/);
    assert.throws(() => finalPrice(value, '', 'record:price'), /record:price.*Invalid price/);
  }
});
test('Sheets mapping preserves evidence, ignores inactive placeholders, and exposes one final amount', () => {
  const [row, placeholder] = normalizeSheetRows('Trips_Prices', [
    {trip_id:'test',p_adult:'50',d_adult:'',p_child:'20',d_child:'0',is_active:'TRUE'},
    {trip_id:'',p_adult:'',d_adult:'',is_active:'FALSE'},
  ]);
  assert.equal(row.adult_price, '50'); assert.equal(row.child_price, '0');
  assert.equal(row.p_adult, '50'); assert.equal(row.d_adult, '');
  assert.equal(placeholder.adult_price, undefined);
});
