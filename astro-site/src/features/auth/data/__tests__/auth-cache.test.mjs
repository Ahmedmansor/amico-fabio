import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  authProfileCacheKey,
  saveCachedAuthProfile,
  readCachedAuthProfile,
  clearCachedAuthProfile,
  hasCachedAuthSession,
} from '../auth-cache.ts';

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

test('auth-cache: saves, reads, and clears profile cache safely', () => {
  const storage = createMockStorage();
  const session = {
    userId: 'user-123',
    profile: {
      displayName: 'Mario Rossi',
      email: 'mario@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  };

  saveCachedAuthProfile(session, storage, () => 5000);
  assert.equal(storage.map.has(authProfileCacheKey), true);

  const cached = readCachedAuthProfile(storage);
  assert.deepEqual(cached, {
    userId: 'user-123',
    profile: {
      displayName: 'Mario Rossi',
      email: 'mario@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    savedAt: 5000,
  });

  clearCachedAuthProfile(storage);
  assert.equal(readCachedAuthProfile(storage), null);
});

test('auth-cache: corrupt or oversized data returns null without throwing', () => {
  const storage = createMockStorage();
  storage.setItem(authProfileCacheKey, 'not-json');
  assert.equal(readCachedAuthProfile(storage), null);

  storage.setItem(authProfileCacheKey, JSON.stringify({ userId: 123 }));
  assert.equal(readCachedAuthProfile(storage), null);

  storage.setItem(authProfileCacheKey, 'x'.repeat(3000));
  assert.equal(readCachedAuthProfile(storage), null);
});

test('auth-cache: detects Supabase session keys or cached profile', () => {
  const storage = createMockStorage();
  assert.equal(hasCachedAuthSession(storage), false);

  storage.setItem('sb-xyz-auth-token', JSON.stringify({ access_token: 'abc' }));
  assert.equal(hasCachedAuthSession(storage), true);

  storage.removeItem('sb-xyz-auth-token');
  assert.equal(hasCachedAuthSession(storage), false);

  saveCachedAuthProfile({ userId: 'u1', profile: { displayName: null, email: null, avatarUrl: null } }, storage);
  assert.equal(hasCachedAuthSession(storage), true);
});
