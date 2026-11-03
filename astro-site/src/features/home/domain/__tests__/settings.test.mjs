import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixtureRows } from '../../../../../qa/data/fixtures.mjs';
import { mapSettings } from '../settings.ts';
test('the existing banner stays active regardless of its expired date metadata', () => {
  const settings = mapSettings(fixtureRows('Global_Settings'), ['it', 'en']);
  assert.equal(settings[0].active, true); assert.equal(settings[0].endDate, '2026-01-01 0:00');
  assert.equal(settings[0].values.it, 'Offerta di Capodanno! 🎄');
  assert.equal(settings[1].values.it, '39333000000');
});
test('duplicate setting keys and missing language values fail', () => {
  const data = fixtureRows('Global_Settings');
  assert.throws(() => mapSettings([...data, data[0]], ['it', 'en']), /Duplicate key/);
  data[0].val_en = ''; assert.throws(() => mapSettings(data, ['it', 'en']), /val_en/);
});
