import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  readCachedOnboarding,
  saveCachedOnboarding,
  clearCachedOnboarding,
  getOnboardingCacheKey,
} from '../onboarding-cache.ts';

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
const version = 'welcome-v1';

test('onboarding-cache: returns null on cache miss', () => {
  const storage = createMockStorage();
  assert.equal(readCachedOnboarding(userA, version, storage), null);
});

test('onboarding-cache: saves and reads confirmed onboarding entry', () => {
  const storage = createMockStorage();
  saveCachedOnboarding(
    {
      userId: userA,
      rolloutVersion: version,
      status: 'already-resolved',
      reason: 'already-completed',
    },
    storage
  );

  const entry = readCachedOnboarding(userA, version, storage);
  assert.ok(entry);
  assert.equal(entry.userId, userA);
  assert.equal(entry.rolloutVersion, version);
  assert.equal(entry.status, 'already-resolved');
  assert.equal(entry.reason, 'already-completed');
  assert.equal(typeof entry.timestamp, 'number');
});

test('onboarding-cache: accounts are isolated by userId and rolloutVersion', () => {
  const storage = createMockStorage();
  saveCachedOnboarding(
    {
      userId: userA,
      rolloutVersion: version,
      status: 'completed',
      reason: 'completed',
    },
    storage
  );

  assert.equal(readCachedOnboarding(userB, version, storage), null);
  assert.equal(readCachedOnboarding(userA, 'welcome-v2', storage), null);
});

test('onboarding-cache: clears specific or all versions for user', () => {
  const storage = createMockStorage();
  saveCachedOnboarding(
    {userId: userA, rolloutVersion: 'v1', status: 'completed', reason: 'completed'},
    storage
  );
  saveCachedOnboarding(
    {userId: userA, rolloutVersion: 'v2', status: 'skipped', reason: 'skipped'},
    storage
  );
  saveCachedOnboarding(
    {userId: userB, rolloutVersion: 'v1', status: 'ineligible', reason: 'grandfathered'},
    storage
  );

  clearCachedOnboarding(userA, 'v1', storage);
  assert.equal(readCachedOnboarding(userA, 'v1', storage), null);
  assert.ok(readCachedOnboarding(userA, 'v2', storage));
  assert.ok(readCachedOnboarding(userB, 'v1', storage));

  clearCachedOnboarding(userA, undefined, storage);
  assert.equal(readCachedOnboarding(userA, 'v2', storage), null);
  assert.ok(readCachedOnboarding(userB, 'v1', storage));
});

test('onboarding-cache: expires after maxAgeMs', () => {
  const storage = createMockStorage();
  const now = 1000000;
  saveCachedOnboarding(
    {
      userId: userA,
      rolloutVersion: version,
      status: 'already-resolved',
      reason: 'already-completed',
      timestamp: now,
    },
    storage
  );

  assert.ok(readCachedOnboarding(userA, version, 300_000, now + 100_000, storage));
  assert.equal(readCachedOnboarding(userA, version, 300_000, now + 301_000, storage), null);
});

test('onboarding-cache: rejects skipped-locally as cache miss and refuses to save it', () => {
  const storage = createMockStorage();
  // 1. saveCachedOnboarding refuses to save skipped-locally
  saveCachedOnboarding(
    {
      userId: userA,
      rolloutVersion: version,
      status: 'skipped',
      reason: 'skipped-locally',
    },
    storage
  );
  assert.equal(readCachedOnboarding(userA, version, 300_000, Date.now(), storage), null);

  // 2. Pre-existing skipped-locally in storage is treated as cache miss
  storage.setItem(
    getOnboardingCacheKey(userA, version),
    JSON.stringify({
      userId: userA,
      rolloutVersion: version,
      status: 'skipped',
      reason: 'skipped-locally',
      timestamp: 1000000,
    })
  );
  assert.equal(readCachedOnboarding(userA, version, 300_000, 1000000, storage), null);
});

test('onboarding-cache: rejects corrupted or invalid JSON gracefully', () => {
  const storage = createMockStorage();
  storage.setItem(getOnboardingCacheKey(userA, version), 'not-valid-json');
  assert.equal(readCachedOnboarding(userA, version, 300_000, Date.now(), storage), null);

  storage.setItem(getOnboardingCacheKey(userA, version), JSON.stringify({invalid: true}));
  assert.equal(readCachedOnboarding(userA, version, 300_000, Date.now(), storage), null);
});

test('onboarding-cache: protected against throwing storage getter (SecurityError)', () => {
  const originalWindow = globalThis.window;
  try {
    globalThis.window = {
      get localStorage() {
        throw new Error('SecurityError: Access is denied');
      },
    };
    assert.equal(readCachedOnboarding(userA, version), null);
    assert.doesNotThrow(() => saveCachedOnboarding({userId: userA, rolloutVersion: version, status: 'completed', reason: 'ok'}));
    assert.doesNotThrow(() => clearCachedOnboarding(userA));
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});
