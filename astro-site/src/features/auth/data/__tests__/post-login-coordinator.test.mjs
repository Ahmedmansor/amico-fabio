import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPostLoginCoordinator} from '../post-login-coordinator.ts';

const userA = '00000000-0000-4000-8000-0000000000a1';
const userB = '00000000-0000-4000-8000-0000000000b1';

function createFixture() {
  const records = new Map();
  const decisionCalls = [];
  const readCalls = [];
  let readFailure = false;
  let writeFailure = false;
  let delayedRead = null;

  const onboardingRepo = {
    async read(userId) {
      readCalls.push(userId);
      if (delayedRead) {
        await delayedRead;
      }
      if (readFailure) {
        return {ok: false, reason: 'failed'};
      }
      const rec = records.get(userId);
      return {ok: true, value: rec ? structuredClone(rec) : null};
    },
    async recordDecision(userId, decision, version) {
      decisionCalls.push({userId, decision, version});
      if (writeFailure) {
        return {ok: false, reason: 'failed'};
      }
      const rec = records.get(userId);
      if (rec) {
        if (decision === 'complete') rec.completedAt = new Date().toISOString();
        if (decision === 'skip') rec.skippedAt = new Date().toISOString();
      }
      return {
        ok: true,
        value: {
          outcome: 'applied',
          completedAt: rec?.completedAt ?? null,
          skippedAt: rec?.skippedAt ?? null,
        },
      };
    },
  };

  const sessionStore = new Set();
  const stateTransitions = [];

  const createCoordinator = () =>
    createPostLoginCoordinator({
      onboardingRepo,
      sessionStore,
      onStateChange: s => stateTransitions.push(s),
    });

  return {
    records,
    decisionCalls,
    readCalls,
    sessionStore,
    stateTransitions,
    createCoordinator,
    setReadFailure: v => (readFailure = v),
    setWriteFailure: v => (writeFailure = v),
    setDelayedRead: p => (delayedRead = p),
  };
}

test('new eligible user with favorites: prompts with honest synced status and display name', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const coordinator = f.createCoordinator();
  coordinator.updateWishlistSync({status: 'synced', count: 3});
  await coordinator.connectUser(userA, {displayName: 'Mario Rossi'});

  const state = coordinator.getState();
  assert.equal(state.status, 'prompt');
  assert.equal(state.displayName, 'Mario Rossi');
  assert.deepEqual(state.syncReport, {status: 'synced', count: 3});
  assert.equal(state.decisionReason, 'new-eligible');
});

test('new eligible user with NO favorites: resolves onboarding independently of favorites', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const coordinator = f.createCoordinator();
  coordinator.updateWishlistSync({status: 'none'});
  await coordinator.connectUser(userA, {displayName: null});

  const state = coordinator.getState();
  assert.equal(state.status, 'prompt');
  assert.equal(state.displayName, null);
  assert.deepEqual(state.syncReport, {status: 'none'});
});

test('login is never misreported as sync success; wishlist failures preserve account access and favorites', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const coordinator = f.createCoordinator();

  // 1. Initial state when wishlist is still syncing
  coordinator.updateWishlistSync({status: 'syncing'});
  await coordinator.connectUser(userA, {displayName: 'Luigi'});

  assert.equal(coordinator.getState().status, 'prompt');
  assert.deepEqual(coordinator.getState().syncReport, {status: 'syncing'});

  // 2. Wishlist sync encounters an error
  coordinator.updateWishlistSync({status: 'failed', reason: 'storage'});
  const failedState = coordinator.getState();
  assert.equal(failedState.status, 'prompt');
  assert.deepEqual(failedState.syncReport, {status: 'failed', reason: 'storage'});
  assert.equal(failedState.userId, userA); // Account remains completely logged in and usable
});

test('returning legacy grandfathered user (isEligible=false) is never prompted', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: false,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: '2026-10-26T00:00:00.000Z',
  });

  const coordinator = f.createCoordinator();
  await coordinator.connectUser(userA, {displayName: 'Old User'});

  const state = coordinator.getState();
  assert.equal(state.status, 'ineligible');
  assert.equal(state.decisionReason, 'legacy-ineligible');
});

test('already completed or skipped account is not prompted', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: '2026-10-26T01:00:00.000Z',
    skippedAt: null,
  });

  const coordinator = f.createCoordinator();
  await coordinator.connectUser(userA, {displayName: 'Completed User'});

  assert.equal(coordinator.getState().status, 'already-resolved');
  assert.equal(coordinator.getState().decisionReason, 'already-completed');
});

test('missing or failed onboarding read fails closed without prompting', async () => {
  const f = createFixture();
  f.setReadFailure(true);

  const coordinator = f.createCoordinator();
  await coordinator.connectUser(userA, {displayName: 'Test'});

  assert.equal(coordinator.getState().status, 'ineligible');
  assert.equal(coordinator.getState().decisionReason, 'failed');
});

test('late response isolation: user switch discards pending read from previous user', async () => {
  const f = createFixture();
  let resolveUserARead;
  f.setDelayedRead(new Promise(resolve => (resolveUserARead = resolve)));

  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });
  f.records.set(userB, {
    userId: userB,
    rolloutVersion: 'welcome-v1',
    isEligible: false,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const coordinator = f.createCoordinator();

  // Start connecting User A (delayed)
  const connectAPromise = coordinator.connectUser(userA, {displayName: 'User A'});

  // Switch to User B (clear delayed read first so user B can resolve immediately)
  f.setDelayedRead(null);
  const connectBPromise = coordinator.connectUser(userB, {displayName: 'User B'});

  // Now resolve User A's slow read
  resolveUserARead();
  await Promise.all([connectAPromise, connectBPromise]);

  // Current state MUST reflect User B and NOT User A's late prompt!
  const finalState = coordinator.getState();
  assert.equal(finalState.userId, userB);
  assert.equal(finalState.status, 'ineligible');
  assert.equal(finalState.decisionReason, 'legacy-ineligible');
});

test('complete and skip persist decisions and suppress re-prompting during session', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const coordinator = f.createCoordinator();
  await coordinator.connectUser(userA, {displayName: 'Mario'});
  assert.equal(coordinator.getState().status, 'prompt');

  const completeRes = await coordinator.complete();
  assert.equal(completeRes.ok, true);
  assert.equal(coordinator.getState().status, 'completed');
  assert.equal(f.decisionCalls.length, 1);
  assert.equal(f.decisionCalls[0].decision, 'complete');

  // Re-connecting the same user during this session is suppressed
  await coordinator.connectUser(userA, {displayName: 'Mario'});
  assert.equal(coordinator.getState().status, 'suppressed');
});

test('dismiss records skip asynchronously and suppresses repeat prompt', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const coordinator = f.createCoordinator();
  await coordinator.connectUser(userA, {displayName: 'Mario'});
  assert.equal(coordinator.getState().status, 'prompt');

  coordinator.dismiss();
  assert.equal(coordinator.getState().status, 'skipped');
  assert.equal(f.sessionStore.has(userA), true);
});

test('complete write failure leaves prompt open for retry and does not suppress session', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });
  f.setWriteFailure(true);

  const coordinator = f.createCoordinator();
  await coordinator.connectUser(userA, {displayName: 'Mario'});
  assert.equal(coordinator.getState().status, 'prompt');

  const result = await coordinator.complete();
  assert.equal(result.ok, false);
  // Status remains in prompt so user can retry, and session is not suppressed
  assert.equal(coordinator.getState().status, 'prompt');
  assert.equal(f.sessionStore.has(userA), false);

  // Subsequent retry succeeds when write failure clears
  f.setWriteFailure(false);
  const retryResult = await coordinator.complete();
  assert.equal(retryResult.ok, true);
  assert.equal(coordinator.getState().status, 'completed');
  assert.equal(f.sessionStore.has(userA), true);
});

test('skip write failure falls back to local skip, preserves session suppression, does not save to cache, and reconciles later', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });
  f.setWriteFailure(true);
  const cacheMap = new Map();

  let serverOnline = false;
  const coordinator = createPostLoginCoordinator({
    onboardingRepo: {
      read: async u => ({ok: true, value: f.records.get(u)}),
      recordDecision: async (_u, _d, _v) => {
        if (!serverOnline) return {ok: false, reason: 'network-error'};
        return {ok: true, value: {outcome: 'applied', completedAt: null, skippedAt: new Date().toISOString()}};
      },
    },
    sessionStore: f.sessionStore,
    cache: {
      read: (u, v) => cacheMap.get(`${u}:${v}`) ?? null,
      save: e => cacheMap.set(`${e.userId}:${e.rolloutVersion}`, e),
    },
  });

  await coordinator.connectUser(userA, {displayName: 'Mario'});
  assert.equal(coordinator.getState().status, 'prompt');

  // Skip fails on server
  const result = await coordinator.skip();
  assert.equal(result.ok, true);
  assert.equal(result.outcome, 'skipped-locally');
  assert.equal(coordinator.getState().status, 'skipped');
  assert.equal(coordinator.getState().decisionReason, 'skipped-locally');
  assert.equal(f.sessionStore.has(userA), true);
  // CRITICAL: Durable cache must NOT have skipped-locally!
  assert.equal(cacheMap.has(`${userA}:welcome-v1`), false);

  // Now server recovers
  serverOnline = true;

  // Reconcile via connectUser
  await coordinator.connectUser(userA, {displayName: 'Mario'});
  assert.equal(coordinator.getState().status, 'already-resolved');
  assert.equal(coordinator.getState().decisionReason, 'applied');
  // CRITICAL: Now confirmed result is cached!
  assert.deepEqual(cacheMap.get(`${userA}:welcome-v1`), {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    status: 'skipped',
    reason: 'applied',
  });
});

test('onboarding cache: cache hit bypasses repo read completely', async () => {
  const cacheMap = new Map();
  cacheMap.set(`${userA}:welcome-v1`, {status: 'already-resolved', reason: 'already-completed'});

  const coordinator = createPostLoginCoordinator({
    onboardingRepo: {
      read: async () => { throw new Error('Repo read should not be called on cache hit'); },
      recordDecision: async () => ({ok: true}),
    },
    cache: {
      read: (u, v) => cacheMap.get(`${u}:${v}`) ?? null,
      save: e => cacheMap.set(`${e.userId}:${e.rolloutVersion}`, e),
    },
  });

  await coordinator.connectUser(userA, {displayName: 'Ahmed'});
  assert.equal(coordinator.getState().status, 'already-resolved');
  assert.equal(coordinator.getState().decisionReason, 'already-completed');
});

test('onboarding cache: completed and skipped decisions are saved to cache', async () => {
  const f = createFixture();
  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });
  const cacheMap = new Map();

  const coordinator = createPostLoginCoordinator({
    onboardingRepo: {
      read: async u => ({ok: true, value: f.records.get(u)}),
      recordDecision: async (_u, d) => ({ok: true, value: {outcome: d}}),
    },
    cache: {
      read: (u, v) => cacheMap.get(`${u}:${v}`) ?? null,
      save: e => cacheMap.set(`${e.userId}:${e.rolloutVersion}`, e),
    },
  });

  await coordinator.connectUser(userA, {displayName: 'Ahmed'});
  assert.equal(coordinator.getState().status, 'prompt');
  assert.equal(cacheMap.has(`${userA}:welcome-v1`), false);

  await coordinator.complete();
  assert.equal(coordinator.getState().status, 'completed');
  assert.deepEqual(cacheMap.get(`${userA}:welcome-v1`), {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    status: 'completed',
    reason: 'complete',
  });
});

test('late reconciliation response isolation: user switch discards pending reconciliation from previous user and preserves new user state', async () => {
  const f = createFixture();
  const cacheMap = new Map();

  let resolveUserASkip;
  const slowSkipPromise = new Promise(resolve => (resolveUserASkip = resolve));

  f.records.set(userA, {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });
  f.records.set(userB, {
    userId: userB,
    rolloutVersion: 'welcome-v1',
    isEligible: false,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
  });

  const reconciliationStore = new Map();
  // userA has a pending skip
  reconciliationStore.set(userA, 'skip');

  const coordinator = createPostLoginCoordinator({
    onboardingRepo: {
      read: async u => ({ok: true, value: f.records.get(u)}),
      recordDecision: async (u, _d, _v) => {
        if (u === userA) {
          await slowSkipPromise;
        }
        return {ok: true, value: {outcome: 'applied', completedAt: null, skippedAt: new Date().toISOString()}};
      },
    },
    reconciliationStore: {
      get: u => reconciliationStore.get(u) ?? null,
      set: (u, a) => reconciliationStore.set(u, a),
      remove: u => reconciliationStore.delete(u),
    },
    cache: {
      read: (u, v) => cacheMap.get(`${u}:${v}`) ?? null,
      save: e => cacheMap.set(`${e.userId}:${e.rolloutVersion}`, e),
    },
  });

  // Start connecting User A (triggers pending reconciliation for A, which pauses on slowSkipPromise)
  const connectAPromise = coordinator.connectUser(userA, {displayName: 'User A'});

  // Switch to User B immediately!
  const connectBPromise = coordinator.connectUser(userB, {displayName: 'User B'});

  // Wait for User B to finish connectUser
  await connectBPromise;
  assert.equal(coordinator.getState().userId, userB);
  assert.equal(coordinator.getState().status, 'ineligible');
  assert.equal(coordinator.getState().decisionReason, 'legacy-ineligible');

  // Now resolve User A's slow reconciliation
  resolveUserASkip();
  await connectAPromise;

  // CRITICAL: Coordinator state MUST STILL be User B, and not overwritten by User A's reconciliation!
  const finalState = coordinator.getState();
  assert.equal(finalState.userId, userB);
  assert.equal(finalState.status, 'ineligible');
  assert.equal(finalState.decisionReason, 'legacy-ineligible');

  // User A's reconciliation did succeed in the background and was saved to A's cache
  assert.deepEqual(cacheMap.get(`${userA}:welcome-v1`), {
    userId: userA,
    rolloutVersion: 'welcome-v1',
    status: 'skipped',
    reason: 'applied',
  });
});

test('reconciliation store: protected against throwing sessionStorage getter (SecurityError)', () => {
  const originalWindow = globalThis.window;
  try {
    globalThis.window = {
      get sessionStorage() {
        throw new Error('SecurityError: Access is denied');
      },
    };
    const coordinator = createPostLoginCoordinator({
      onboardingRepo: {
        read: async () => ({ok: true, value: null}),
        recordDecision: async () => ({ok: true}),
      },
    });
    assert.doesNotThrow(() => coordinator.getState());
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});

