import {isPreferenceRequestId} from '../../reminders/domain/preferences.ts';

export const ONBOARDING_ROLLOUT_VERSION = 'welcome-v1';

export interface AccountOnboardingRecord {
  userId: string;
  rolloutVersion: string;
  isEligible: boolean;
  eligibleAt: string | null;
  completedAt: string | null;
  skippedAt: string | null;
}

export type OnboardingPromptDecision =
  | { shouldPrompt: true; reason: 'new-eligible' }
  | { shouldPrompt: false; reason: 'already-completed' | 'already-skipped' | 'legacy-ineligible' | 'unknown' | 'version-mismatch' };

/**
 * Pure domain evaluation for post-registration onboarding welcome dialog.
 * Fail-closed: missing, malformed or unknown state never prompts the user.
 * Grandfathered accounts (isEligible === false) are never prompted.
 */
export function evaluateOnboardingPrompt(
  record: AccountOnboardingRecord | null | undefined,
  expectedRolloutVersion: string = ONBOARDING_ROLLOUT_VERSION
): OnboardingPromptDecision {
  if (!record || !isPreferenceRequestId(record.userId)) {
    return { shouldPrompt: false, reason: 'unknown' };
  }

  if (record.rolloutVersion !== expectedRolloutVersion) {
    return { shouldPrompt: false, reason: 'version-mismatch' };
  }

  if (!record.isEligible) {
    return { shouldPrompt: false, reason: 'legacy-ineligible' };
  }

  if (record.completedAt !== null) {
    return { shouldPrompt: false, reason: 'already-completed' };
  }

  if (record.skippedAt !== null) {
    return { shouldPrompt: false, reason: 'already-skipped' };
  }

  return { shouldPrompt: true, reason: 'new-eligible' };
}

export function completeOnboardingRecord(
  record: AccountOnboardingRecord,
  completedAt: string = new Date().toISOString()
): AccountOnboardingRecord {
  if (!record.isEligible) {
    throw new Error('[onboarding] Cannot complete onboarding for ineligible account.');
  }
  if (record.completedAt !== null || record.skippedAt !== null) {
    return record; // Idempotent: already resolved
  }
  return {
    ...record,
    completedAt,
    skippedAt: null,
  };
}

export function skipOnboardingRecord(
  record: AccountOnboardingRecord,
  skippedAt: string = new Date().toISOString()
): AccountOnboardingRecord {
  if (!record.isEligible) {
    throw new Error('[onboarding] Cannot skip onboarding for ineligible account.');
  }
  if (record.completedAt !== null || record.skippedAt !== null) {
    return record; // Idempotent: already resolved
  }
  return {
    ...record,
    completedAt: null,
    skippedAt,
  };
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function parseOnboardingRecord(value: unknown): AccountOnboardingRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;

  if (
    !isPreferenceRequestId(obj.userId) ||
    typeof obj.rolloutVersion !== 'string' ||
    !obj.rolloutVersion ||
    typeof obj.isEligible !== 'boolean'
  ) {
    return null;
  }

  const eligibleAt = obj.eligibleAt === null || obj.eligibleAt === undefined ? null : obj.eligibleAt;
  const completedAt = obj.completedAt === null || obj.completedAt === undefined ? null : obj.completedAt;
  const skippedAt = obj.skippedAt === null || obj.skippedAt === undefined ? null : obj.skippedAt;

  if (eligibleAt !== null && !isValidIsoTimestamp(eligibleAt)) return null;
  if (completedAt !== null && !isValidIsoTimestamp(completedAt)) return null;
  if (skippedAt !== null && !isValidIsoTimestamp(skippedAt)) return null;

  // Cannot be both completed and skipped
  if (completedAt !== null && skippedAt !== null) return null;

  return {
    userId: obj.userId,
    rolloutVersion: obj.rolloutVersion,
    isEligible: obj.isEligible,
    eligibleAt,
    completedAt,
    skippedAt,
  };
}

export type OnboardingDecisionOutcome =
  | 'applied'
  | 'already-resolved'
  | 'ineligible'
  | 'version-mismatch'
  | 'missing-record'
  | 'invalid-input';

export interface OnboardingDecisionResult {
  outcome: OnboardingDecisionOutcome;
  completedAt: string | null;
  skippedAt: string | null;
}

export type OnboardingResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'unavailable' | 'failed' | 'invalid-input' | 'unauthorized' };

export interface OnboardingRepository {
  read(userId: string): Promise<OnboardingResult<AccountOnboardingRecord | null>>;
  recordDecision(
    userId: string,
    decision: 'complete' | 'skip',
    version: string
  ): Promise<OnboardingResult<OnboardingDecisionResult>>;
}

export function parseOnboardingDecisionResult(value: unknown): OnboardingDecisionResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  const allowedOutcomes: OnboardingDecisionOutcome[] = [
    'applied',
    'already-resolved',
    'ineligible',
    'version-mismatch',
    'missing-record',
    'invalid-input',
  ];
  if (typeof obj.outcome !== 'string' || !allowedOutcomes.includes(obj.outcome as OnboardingDecisionOutcome)) {
    return null;
  }
  const completedAt = obj.completedAt === null || obj.completedAt === undefined ? null : obj.completedAt;
  const skippedAt = obj.skippedAt === null || obj.skippedAt === undefined ? null : obj.skippedAt;
  if (completedAt !== null && !isValidIsoTimestamp(completedAt)) return null;
  if (skippedAt !== null && !isValidIsoTimestamp(skippedAt)) return null;

  return {
    outcome: obj.outcome as OnboardingDecisionOutcome,
    completedAt,
    skippedAt,
  };
}

