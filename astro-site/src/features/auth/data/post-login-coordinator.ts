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

export interface PostLoginCoordinatorOptions {
  onboardingRepo: OnboardingRepository;
  rolloutVersion?: string;
  sessionStore?: {
    has(userId: string): boolean;
    add(userId: string): void;
  };
  onStateChange?: (state: PostLoginCoordinatorState) => void;
}

export function createPostLoginCoordinator(options: PostLoginCoordinatorOptions) {
  const {
    onboardingRepo,
    rolloutVersion = ONBOARDING_ROLLOUT_VERSION,
    sessionStore = new Set<string>(),
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
        state = {
          ...state,
          status: isResolved ? 'already-resolved' : 'ineligible',
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

      sessionStore.add(targetUser);

      let result;
      try {
        result = await onboardingRepo.recordDecision(targetUser, 'complete', rolloutVersion);
      } catch (err) {
        if (isCurrent(targetUser, opGen)) {
          state = {
            ...state,
            status: 'completed',
            decisionReason: 'decision-write-failed',
          };
          emit();
        }
        return { ok: false, error: String(err) };
      }

      if (!isCurrent(targetUser, opGen)) {
        return { ok: false, error: 'stale' };
      }

      if (result.ok) {
        state = {
          ...state,
          status: 'completed',
          decisionReason: result.value.outcome,
        };
        emit();
        return { ok: true, outcome: result.value.outcome };
      } else {
        state = {
          ...state,
          status: 'completed',
          decisionReason: result.reason,
        };
        emit();
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
        if (isCurrent(targetUser, opGen)) {
          state = {
            ...state,
            status: 'skipped',
            decisionReason: 'decision-write-failed',
          };
          emit();
        }
        return { ok: false, error: String(err) };
      }

      if (!isCurrent(targetUser, opGen)) {
        return { ok: false, error: 'stale' };
      }

      if (result.ok) {
        state = {
          ...state,
          status: 'skipped',
          decisionReason: result.value.outcome,
        };
        emit();
        return { ok: true, outcome: result.value.outcome };
      } else {
        state = {
          ...state,
          status: 'skipped',
          decisionReason: result.reason,
        };
        emit();
        return { ok: false, error: result.reason };
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
        void onboardingRepo.recordDecision(targetUser, 'skip', rolloutVersion).catch(() => {});
      }
    },
  };
}
