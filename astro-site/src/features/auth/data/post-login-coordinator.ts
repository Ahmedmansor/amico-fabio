import {
  evaluateOnboardingPrompt,
  ONBOARDING_ROLLOUT_VERSION,
  type AccountOnboardingRecord,
  type OnboardingRepository,
} from '../domain/onboarding.ts';

export type PostLoginStatus =
  | 'idle'
  | 'checking'
  | 'prompt'
  | 'ineligible'
  | 'already-resolved'
  | 'suppressed'
  | 'completed'
  | 'skipped';

export type WishlistSyncReport =
  | { status: 'none' }
  | { status: 'syncing' }
  | { status: 'synced'; count: number }
  | { status: 'failed'; reason?: string };

export interface PostLoginCoordinatorState {
  userId: string | null;
  status: PostLoginStatus;
  syncReport: WishlistSyncReport;
  displayName: string | null;
  onboardingRecord: AccountOnboardingRecord | null;
  decisionReason: string | null;
}

export interface PostLoginCache {
  read(userId: string, rolloutVersion: string): { status: 'already-resolved' | 'completed' | 'skipped' | 'ineligible'; reason: string } | null;
  save(entry: { userId: string; rolloutVersion: string; status: 'already-resolved' | 'completed' | 'skipped' | 'ineligible'; reason: string }): void;
}

export interface ReconciliationStore {
  get(userId: string): 'skip' | null;
  set(userId: string, action: 'skip'): void;
  remove(userId: string): void;
}

function resolveSessionStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const store = window.sessionStorage;
    if (!store) return null;
    const probe = 'fabio:auth:session-test';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

function createDefaultReconciliationStore(): ReconciliationStore {
  const memoryStore = new Map<string, 'skip'>();
  return {
    get(userId: string) {
      const storage = resolveSessionStorage();
      if (storage) {
        try {
          const val = storage.getItem(`fabio:auth:onboarding:reconcile:${userId}`);
          return val === 'skip' ? 'skip' : null;
        } catch {
          return memoryStore.get(userId) ?? null;
        }
      }
      return memoryStore.get(userId) ?? null;
    },
    set(userId: string, action: 'skip') {
      memoryStore.set(userId, action);
      const storage = resolveSessionStorage();
      if (storage) {
        try {
          storage.setItem(`fabio:auth:onboarding:reconcile:${userId}`, action);
        } catch {}
      }
    },
    remove(userId: string) {
      memoryStore.delete(userId);
      const storage = resolveSessionStorage();
      if (storage) {
        try {
          storage.removeItem(`fabio:auth:onboarding:reconcile:${userId}`);
        } catch {}
      }
    },
  };
}

export interface PostLoginCoordinatorOptions {
  onboardingRepo: OnboardingRepository;
  rolloutVersion?: string;
  sessionStore?: {
    has(userId: string): boolean;
    add(userId: string): void;
  };
  reconciliationStore?: ReconciliationStore;
  cache?: PostLoginCache;
  onStateChange?: (state: PostLoginCoordinatorState) => void;
}

export function createPostLoginCoordinator(options: PostLoginCoordinatorOptions) {
  const {
    onboardingRepo,
    rolloutVersion = ONBOARDING_ROLLOUT_VERSION,
    sessionStore = new Set<string>(),
    reconciliationStore = options.reconciliationStore ?? createDefaultReconciliationStore(),
    cache,
    onStateChange,
  } = options;

  let currentGeneration = 0;
  let activeUserId: string | null = null;

  let state: PostLoginCoordinatorState = {
    userId: null,
    status: 'idle',
    syncReport: { status: 'none' },
    displayName: null,
    onboardingRecord: null,
    decisionReason: null,
  };

  function emit(): void {
    onStateChange?.(structuredClone(state));
  }

  function isCurrent(userId: string | null, generation: number): boolean {
    return activeUserId === userId && currentGeneration === generation;
  }

  return {
    getState(): PostLoginCoordinatorState {
      return structuredClone(state);
    },

    async connectUser(
      userId: string | null,
      profile?: { displayName?: string | null } | null
    ): Promise<void> {
      currentGeneration++;
      const opGen = currentGeneration;
      activeUserId = userId;

      if (!userId) {
        state = {
          userId: null,
          status: 'idle',
          syncReport: { status: 'none' },
          displayName: null,
          onboardingRecord: null,
          decisionReason: null,
        };
        emit();
        return;
      }

      const displayName = profile?.displayName?.trim() || null;

      // Reconcile any pending temporary skip if network is available
      const pendingAction = reconciliationStore.get(userId);
      if (pendingAction === 'skip') {
        try {
          const recResult = await onboardingRepo.recordDecision(userId, 'skip', rolloutVersion);
          if (recResult.ok) {
            reconciliationStore.remove(userId);
            cache?.save({
              userId,
              rolloutVersion,
              status: 'skipped',
              reason: recResult.value.outcome,
            });
            if (!isCurrent(userId, opGen)) return;
            state = {
              userId,
              status: 'already-resolved',
              syncReport: state.syncReport,
              displayName,
              onboardingRecord: null,
              decisionReason: recResult.value.outcome,
            };
            emit();
            return;
          }
        } catch {
          // Server still unavailable; leave pending for future reconciliation
        }
        if (!isCurrent(userId, opGen)) return;
      }

      // Check persistent/durable cache first before network or sessionStore
      const cached = cache?.read(userId, rolloutVersion);
      if (cached) {
        state = {
          userId,
          status: cached.status,
          syncReport: state.syncReport,
          displayName,
          onboardingRecord: null,
          decisionReason: cached.reason,
        };
        emit();
        return;
      }

      // Check session suppression first
      if (sessionStore.has(userId)) {
        state = {
          userId,
          status: 'suppressed',
          syncReport: state.syncReport,
          displayName,
          onboardingRecord: null,
          decisionReason: 'session-suppressed',
        };
        emit();
        return;
      }

      state = {
        userId,
        status: 'checking',
        syncReport: state.syncReport,
        displayName,
        onboardingRecord: null,
        decisionReason: null,
      };
      emit();

      let result;
      try {
        result = await onboardingRepo.read(userId);
      } catch {
        if (!isCurrent(userId, opGen)) return;
        state = {
          ...state,
          status: 'ineligible',
          decisionReason: 'read-failed',
        };
        emit();
        return;
      }

      if (!isCurrent(userId, opGen)) return;

      if (!result.ok || result.value === null) {
        state = {
          ...state,
          status: 'ineligible',
          decisionReason: result.ok ? 'unknown' : result.reason,
        };
        emit();
        return;
      }

      const record = result.value;
      const decision = evaluateOnboardingPrompt(record, rolloutVersion);

      if (decision.shouldPrompt) {
        state = {
          ...state,
          status: 'prompt',
          onboardingRecord: record,
          decisionReason: decision.reason,
        };
      } else {
        const isResolved = decision.reason === 'already-completed' || decision.reason === 'already-skipped';
        const resolvedStatus = isResolved ? 'already-resolved' : 'ineligible';
        cache?.save({
          userId,
          rolloutVersion,
          status: resolvedStatus,
          reason: decision.reason,
        });
        state = {
          ...state,
          status: resolvedStatus,
          onboardingRecord: record,
          decisionReason: decision.reason,
        };
      }
      emit();
    },

    updateWishlistSync(syncReport: WishlistSyncReport): void {
      state = {
        ...state,
        syncReport,
      };
      emit();
    },

    async complete(expectedUserId?: string): Promise<{ ok: boolean; outcome?: string; error?: string }> {
      const opGen = currentGeneration;
      const targetUser = activeUserId;
      if (!targetUser || state.status !== 'prompt') {
        return { ok: false, error: 'not-prompted' };
      }
      if (expectedUserId && expectedUserId !== targetUser) {
        return { ok: false, error: 'stale' };
      }

      let result;
      try {
        result = await onboardingRepo.recordDecision(targetUser, 'complete', rolloutVersion);
      } catch (err) {
        if (!isCurrent(targetUser, opGen)) {
          return { ok: false, error: 'stale' };
        }
        return { ok: false, error: String(err) };
      }

      if (!isCurrent(targetUser, opGen)) {
        return { ok: false, error: 'stale' };
      }

      if (result.ok) {
        sessionStore.add(targetUser);
        reconciliationStore.remove(targetUser);
        cache?.save({
          userId: targetUser,
          rolloutVersion,
          status: 'completed',
          reason: result.value.outcome,
        });
        state = {
          ...state,
          status: 'completed',
          decisionReason: result.value.outcome,
        };
        emit();
        return { ok: true, outcome: result.value.outcome };
      } else {
        return { ok: false, error: result.reason };
      }
    },

    async skip(expectedUserId?: string): Promise<{ ok: boolean; outcome?: string; error?: string }> {
      const opGen = currentGeneration;
      const targetUser = activeUserId;
      if (!targetUser || state.status !== 'prompt') {
        return { ok: false, error: 'not-prompted' };
      }
      if (expectedUserId && expectedUserId !== targetUser) {
        return { ok: false, error: 'stale' };
      }

      sessionStore.add(targetUser);

      let result;
      try {
        result = await onboardingRepo.recordDecision(targetUser, 'skip', rolloutVersion);
      } catch (err) {
        // Outage/failure: record temporary reconciliation, do NOT write to permanent cache
        reconciliationStore.set(targetUser, 'skip');
        if (isCurrent(targetUser, opGen)) {
          state = {
            ...state,
            status: 'skipped',
            decisionReason: 'skipped-locally',
          };
          emit();
        }
        return { ok: true, outcome: 'skipped-locally' };
      }

      if (!isCurrent(targetUser, opGen)) {
        return { ok: false, error: 'stale' };
      }

      if (result.ok) {
        reconciliationStore.remove(targetUser);
        cache?.save({
          userId: targetUser,
          rolloutVersion,
          status: 'skipped',
          reason: result.value.outcome,
        });
        state = {
          ...state,
          status: 'skipped',
          decisionReason: result.value.outcome,
        };
        emit();
        return { ok: true, outcome: result.value.outcome };
      } else {
        // Server rejected: record temporary reconciliation, do NOT write to permanent cache
        reconciliationStore.set(targetUser, 'skip');
        state = {
          ...state,
          status: 'skipped',
          decisionReason: 'skipped-locally',
        };
        emit();
        return { ok: true, outcome: 'skipped-locally' };
      }
    },

    dismiss(): void {
      const targetUser = activeUserId;
      if (!targetUser) return;
      sessionStore.add(targetUser);
      if (state.status === 'prompt') {
        state = {
          ...state,
          status: 'skipped',
          decisionReason: 'dismissed',
        };
        emit();
        void onboardingRepo.recordDecision(targetUser, 'skip', rolloutVersion)
          .then(res => {
            if (res.ok) {
              reconciliationStore.remove(targetUser);
              cache?.save({
                userId: targetUser,
                rolloutVersion,
                status: 'skipped',
                reason: res.value.outcome,
              });
            } else {
              reconciliationStore.set(targetUser, 'skip');
            }
          })
          .catch(() => {
            reconciliationStore.set(targetUser, 'skip');
          });
      }
    },

    async reconcilePending(expectedUserId?: string): Promise<{ ok: boolean; outcome?: string }> {
      const targetUser = expectedUserId ?? activeUserId;
      if (!targetUser) return { ok: false };
      const pending = reconciliationStore.get(targetUser);
      if (!pending) return { ok: true, outcome: 'none' };
      try {
        const recResult = await onboardingRepo.recordDecision(targetUser, pending, rolloutVersion);
        if (recResult.ok) {
          reconciliationStore.remove(targetUser);
          cache?.save({
            userId: targetUser,
            rolloutVersion,
            status: 'skipped',
            reason: recResult.value.outcome,
          });
          return { ok: true, outcome: recResult.value.outcome };
        }
        return { ok: false };
      } catch {
        return { ok: false };
      }
    },
  };
}
