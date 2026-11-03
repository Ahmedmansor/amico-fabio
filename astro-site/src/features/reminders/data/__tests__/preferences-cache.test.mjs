import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  readCachedPreference,
  saveCachedPreference,
  clearCachedPreference,
  clearAllCachedPreferences,
  getPreferenceCacheKey,
} from '../preferences-cache.ts';

function createMockStorage() {
  const store = new Map();
  return {
    getItem: key => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: key => store.delete(key),
    key: index => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

const userA = '00000000-0000-4000-8000-0000000000a1';
const userB = '00000000-0000-4000-8000-0000000000b1';

test('preferences-cache: returns undefined on cache miss', () => {
  const storage = createMockStorage();
  assert.equal(readCachedPreference(userA, 300_000, Date.now(), storage), undefined);
});

const validPrefA = {
  enabled: true,
  locale: 'en',
  wordingVersion: 'wishlist-reminders-v1',
  updatedAt: '2026-10-26T00:00:00.000Z',
  enabledSince: '2026-10-26T00:00:00.000Z',
};

const validPrefB = {
  enabled: false,
  locale: 'it',
  wordingVersion: 'wishlist-reminders-v1',
  updatedAt: '2026-10-26T00:00:00.000Z',
  enabledSince: null,
};

test('preferences-cache: saves and reads confirmed preference', () => {
  const storage = createMockStorage();
  const now = 1000000;
  saveCachedPreference(userA, validPrefA, now, storage);

  const cached = readCachedPreference(userA, 300_000, now + 10_000, storage);
  assert.deepEqual(cached, validPrefA);
});

test('preferences-cache: saves and reads null preference (no preference on account)', () => {
  const storage = createMockStorage();
  const now = 1000000;
  saveCachedPreference(userA, null, now, storage);

  const cached = readCachedPreference(userA, 300_000, now + 10_000, storage);
  assert.equal(cached, null);
});

test('preferences-cache: expires after maxAgeMs', () => {
  const storage = createMockStorage();
  const now = 1000000;
  saveCachedPreference(userA, validPrefA, now, storage);

  // Within 300s
  assert.ok(readCachedPreference(userA, 300_000, now + 299_000, storage));
  // Expired at 301s
  assert.equal(readCachedPreference(userA, 300_000, now + 301_000, storage), undefined);
});

test('preferences-cache: accounts are isolated by userId', () => {
  const storage = createMockStorage();
  saveCachedPreference(userA, validPrefA, 1000000, storage);

  assert.equal(readCachedPreference(userB, 300_000, 1000000, storage), undefined);
});

test('preferences-cache: clear and clearAll work correctly', () => {
  const storage = createMockStorage();
  saveCachedPreference(userA, validPrefA, 1000000, storage);
  saveCachedPreference(userB, validPrefB, 1000000, storage);

  clearCachedPreference(userA, storage);
  assert.equal(readCachedPreference(userA, 300_000, 1000000, storage), undefined);
  assert.ok(readCachedPreference(userB, 300_000, 1000000, storage));

  clearAllCachedPreferences(storage);
  assert.equal(readCachedPreference(userB, 300_000, 1000000, storage), undefined);
});

test('preferences-cache: rejects invalid preference data as cache miss', () => {
  const storage = createMockStorage();
  // 1. enabled is "yes" instead of boolean
  storage.setItem(getPreferenceCacheKey(userA), JSON.stringify({
    userId: userA,
    preference: { enabled: 'yes', locale: 'it', wordingVersion: 'wishlist-reminders-v1', updatedAt: '2026-10-26T00:00:00.000Z', enabledSince: '2026-10-26T00:00:00.000Z' },
    savedAt: 1000000,
  }));
  assert.equal(readCachedPreference(userA, 300_000, 1000000, storage), undefined);

  // 2. locale is invalid "zz"
  storage.setItem(getPreferenceCacheKey(userA), JSON.stringify({
    userId: userA,
    preference: { enabled: true, locale: 'zz', wordingVersion: 'wishlist-reminders-v1', updatedAt: '2026-10-26T00:00:00.000Z', enabledSince: '2026-10-26T00:00:00.000Z' },
    savedAt: 1000000,
  }));
  assert.equal(readCachedPreference(userA, 300_000, 1000000, storage), undefined);

  // 3. invalid non-object or extra malicious fields
  storage.setItem(getPreferenceCacheKey(userA), JSON.stringify({
    userId: userA,
    preference: { enabled: true, locale: 'it', wordingVersion: 'wishlist-reminders-v1', updatedAt: '2026-10-26T00:00:00.000Z', enabledSince: '2026-10-26T00:00:00.000Z', extraField: 123 },
    savedAt: 1000000,
  }));
  assert.equal(readCachedPreference(userA, 300_000, 1000000, storage), undefined);
});

test('preferences-cache: handles corrupt storage gracefully', () => {
  const storage = createMockStorage();
  storage.setItem(getPreferenceCacheKey(userA), 'invalid-json');
  assert.equal(readCachedPreference(userA, 300_000, 1000000, storage), undefined);
});

test('preferences-cache: protected against throwing storage getter (SecurityError)', () => {
  const originalWindow = globalThis.window;
  try {
    globalThis.window = {
      get localStorage() {
        throw new Error('SecurityError: Access is denied');
      },
    };
    assert.equal(readCachedPreference(userA), undefined);
    assert.doesNotThrow(() => saveCachedPreference(userA, validPrefA));
    assert.doesNotThrow(() => clearCachedPreference(userA));
    assert.doesNotThrow(() => clearAllCachedPreferences());
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});
