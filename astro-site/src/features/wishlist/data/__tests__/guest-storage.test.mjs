import { test } from 'node:test';
import assert from 'node:assert/strict';
import { browserGuestStorage, guestWishlistPrefix as prefix, readGuestWishlist, saveGuestFavorite } from '../guest-storage.ts';

function memoryStorage() {
  const entries = new Map();
  return {
    get length() { return entries.size; },
    key(index) { return [...entries.keys()][index] ?? null; },
    getItem(key) { return entries.get(key) ?? null; },
    setItem(key, value) { entries.set(key, value); },
    removeItem(key) { entries.delete(key); },
  };
}

test('two callers preserve unrelated additions and removals without stale list writes', () => {
  const storage = memoryStorage();
  storage.setItem('cookie-preferences', 'untouched');
  assert.equal(saveGuestFavorite(storage, 'a', true).ok, true);
  const staleTab = readGuestWishlist(storage);
  saveGuestFavorite(storage, 'b', true);
  saveGuestFavorite(storage, 'a', false);
  saveGuestFavorite(storage, 'c', true);
  assert.deepEqual(staleTab, { ok: true, value: ['a'] });
  assert.deepEqual(readGuestWishlist(storage), { ok: true, value: ['b', 'c'] });
  assert.equal(storage.getItem('cookie-preferences'), 'untouched');
});

test('same-tour actions are idempotent and latest explicit action wins', () => {
  const storage = memoryStorage();
  for (let n = 0; n < 3; n++) saveGuestFavorite(storage, 'a / رحلة', true);
  assert.deepEqual(readGuestWishlist(storage), { ok: true, value: ['a / رحلة'] });
  saveGuestFavorite(storage, 'a / رحلة', false);
  saveGuestFavorite(storage, 'a / رحلة', false);
  assert.deepEqual(readGuestWishlist(storage), { ok: true, value: [] });
});

test('unavailable storage and quota/security/read failures never report persistence', () => {
  assert.equal(browserGuestStorage(), null);
  assert.deepEqual(readGuestWishlist(null), { ok: false, reason: 'unavailable' });
  assert.deepEqual(saveGuestFavorite(null, 'a', true), { ok: false, reason: 'unavailable' });
  const storage = memoryStorage();
  storage.setItem = () => { throw new Error('quota'); };
  assert.deepEqual(saveGuestFavorite(storage, 'a', true), { ok: false, reason: 'write-failed' });
  storage.removeItem = () => { throw new Error('security'); };
  assert.equal(saveGuestFavorite(storage, 'a', false).ok, false);
  storage.key = () => { throw new Error('read'); };
  Object.defineProperty(storage, 'length', { value: 1 });
  assert.deepEqual(readGuestWishlist(storage), { ok: false, reason: 'read-failed' });
});

test('silently discarded writes are failures, including unsuccessful removal', () => {
  const storage = memoryStorage();
  saveGuestFavorite(storage, 'a', true);
  storage.setItem = () => {};
  storage.removeItem = () => {};
  assert.equal(saveGuestFavorite(storage, 'b', true).ok, false);
  assert.equal(saveGuestFavorite(storage, 'a', false).ok, false);
});

test('corrupt records are reported without overwriting stored data', () => {
  for (const [suffix, value] of [['%broken', '1'], ['', '1'], ['a', 'false'], ['%20a', '1']]) {
    const storage = memoryStorage();
    storage.setItem(prefix + suffix, value);
    assert.deepEqual(readGuestWishlist(storage), { ok: false, reason: 'invalid-data' });
    assert.equal(storage.getItem(prefix + suffix), value);
  }
  assert.deepEqual(saveGuestFavorite(memoryStorage(), '', true), { ok: false, reason: 'invalid-data' });
});
