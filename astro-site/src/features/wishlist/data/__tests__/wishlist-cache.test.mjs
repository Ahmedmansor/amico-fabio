import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveAccountWishlistCache,
  readAccountWishlistCache,
  clearAccountWishlistCache,
  readInitialWishlistIds,
  isAccountWishlistCacheFresh,
} from '../wishlist-cache.ts';
import { authProfileCacheKey } from '../../../auth/data/auth-cache.ts';
import { guestWishlistPrefix, guestPackagePrefix } from '../guest-storage.ts';

function createMockStorage() {
  const map = new Map();
  return {
    map,
    get length() { return map.size; },
    key(index) { return Array.from(map.keys())[index] ?? null; },
    getItem(key) { return map.get(key) ?? null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

test('wishlist-cache: saves, reads, and clears account wishlist cache', () => {
  const storage = createMockStorage();
  const userId = 'usr-456';
  const ids = ['trip:cairo-overday', 'package:sinai-dream'];

  saveAccountWishlistCache(userId, ids, storage, () => 12345);
  const readBack = readAccountWishlistCache(userId, storage);
  assert.deepEqual(readBack, ids);

  clearAccountWishlistCache(userId, storage);
  assert.equal(readAccountWishlistCache(userId, storage), null);
});

test('wishlist-cache: clear all account wishlist caches', () => {
  const storage = createMockStorage();
  saveAccountWishlistCache('u1', ['trip:1'], storage);
  saveAccountWishlistCache('u2', ['trip:2'], storage);
  assert.equal(readAccountWishlistCache('u1', storage)?.length, 1);
  assert.equal(readAccountWishlistCache('u2', storage)?.length, 1);

  clearAccountWishlistCache(undefined, storage);
  assert.equal(readAccountWishlistCache('u1', storage), null);
  assert.equal(readAccountWishlistCache('u2', storage), null);
});

test('wishlist-cache: readInitialWishlistIds yields cached account items when auth user is cached', () => {
  const storage = createMockStorage();
  storage.setItem(authProfileCacheKey, JSON.stringify({ userId: 'u1', profile: { displayName: 'Mario' }, savedAt: 1 }));
  saveAccountWishlistCache('u1', ['trip:pyramids', 'package:luxor'], storage);

  const initial = readInitialWishlistIds(storage);
  assert.equal(initial.userId, 'u1');
  assert.deepEqual([...initial.ids].sort(), ['package:luxor', 'trip:pyramids']);
});

test('wishlist-cache: readInitialWishlistIds falls back to guest items when no auth user is cached', () => {
  const storage = createMockStorage();
  storage.setItem(`${guestWishlistPrefix}ras-mohammed`, '1');
  storage.setItem(`${guestPackagePrefix}classic-sinai`, '1');

  const initial = readInitialWishlistIds(storage);
  assert.equal(initial.userId, null);
  assert.deepEqual([...initial.ids].sort(), ['package:classic-sinai', 'ras-mohammed']);
});

test('wishlist-cache: isAccountWishlistCacheFresh verifies cache within max age', () => {
  const storage = createMockStorage();
  assert.equal(isAccountWishlistCacheFresh('u1', 5000, () => 1000, storage), false);

  saveAccountWishlistCache('u1', ['trip:1'], storage, () => 1000);
  assert.equal(isAccountWishlistCacheFresh('u1', 5000, () => 2000, storage), true);
  assert.equal(isAccountWishlistCacheFresh('u1', 5000, () => 7000, storage), false);
});
