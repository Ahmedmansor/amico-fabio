import {describe, it, expect} from 'vitest';
import {
  ONBOARDING_ROLLOUT_VERSION,
  evaluateOnboardingPrompt,
  completeOnboardingRecord,
  skipOnboardingRecord,
  parseOnboardingRecord,
  parseOnboardingDecisionResult,
  type AccountOnboardingRecord,
} from '../onboarding.ts';

const validUserId = '00000000-0000-4000-8000-000000000001';

function createRecord(overrides: Partial<AccountOnboardingRecord> = {}): AccountOnboardingRecord {
  return {
    userId: validUserId,
    rolloutVersion: ONBOARDING_ROLLOUT_VERSION,
    isEligible: true,
    eligibleAt: '2026-10-26T00:00:00.000Z',
    completedAt: null,
    skippedAt: null,
    ...overrides,
  };
}

describe('evaluateOnboardingPrompt', () => {
  it('identifies genuinely new eligible account as needing welcome prompt', () => {
    const record = createRecord();
    const decision = evaluateOnboardingPrompt(record);
    expect(decision).toEqual({shouldPrompt: true, reason: 'new-eligible'});
  });

  it('rejects completed onboarding and does not prompt', () => {
    const record = createRecord({completedAt: '2026-10-26T01:00:00.000Z'});
    const decision = evaluateOnboardingPrompt(record);
    expect(decision).toEqual({shouldPrompt: false, reason: 'already-completed'});
  });

  it('rejects skipped onboarding and does not prompt', () => {
    const record = createRecord({skippedAt: '2026-10-26T01:00:00.000Z'});
    const decision = evaluateOnboardingPrompt(record);
    expect(decision).toEqual({shouldPrompt: false, reason: 'already-skipped'});
  });

  it('grandfathers legacy accounts (isEligible=false) and never prompts them', () => {
    const record = createRecord({isEligible: false});
    const decision = evaluateOnboardingPrompt(record);
    expect(decision).toEqual({shouldPrompt: false, reason: 'legacy-ineligible'});
  });

  it('fails closed when record is absent, null or undefined (outage safety)', () => {
    expect(evaluateOnboardingPrompt(null)).toEqual({shouldPrompt: false, reason: 'unknown'});
    expect(evaluateOnboardingPrompt(undefined)).toEqual({shouldPrompt: false, reason: 'unknown'});
  });

  it('fails closed when userId is invalid or malformed', () => {
    const record = createRecord({userId: 'not-a-uuid'});
    expect(evaluateOnboardingPrompt(record)).toEqual({shouldPrompt: false, reason: 'unknown'});
  });

  it('rejects record when rollout version does not match', () => {
    const record = createRecord({rolloutVersion: 'old-welcome-v0'});
    expect(evaluateOnboardingPrompt(record)).toEqual({shouldPrompt: false, reason: 'version-mismatch'});
  });
});

describe('completeOnboardingRecord and skipOnboardingRecord', () => {
  it('transitions eligible record to completed', () => {
    const record = createRecord();
    const timestamp = '2026-10-26T02:00:00.000Z';
    const updated = completeOnboardingRecord(record, timestamp);
    expect(updated.completedAt).toBe(timestamp);
    expect(updated.skippedAt).toBeNull();
  });

  it('transitions eligible record to skipped', () => {
    const record = createRecord();
    const timestamp = '2026-10-26T02:00:00.000Z';
    const updated = skipOnboardingRecord(record, timestamp);
    expect(updated.skippedAt).toBe(timestamp);
    expect(updated.completedAt).toBeNull();
  });

  it('is idempotent when already completed or skipped', () => {
    const completed = createRecord({completedAt: '2026-10-26T01:00:00.000Z'});
    expect(completeOnboardingRecord(completed, '2026-10-26T03:00:00.000Z')).toBe(completed);
    expect(skipOnboardingRecord(completed, '2026-10-26T03:00:00.000Z')).toBe(completed);

    const skipped = createRecord({skippedAt: '2026-10-26T01:00:00.000Z'});
    expect(completeOnboardingRecord(skipped, '2026-10-26T03:00:00.000Z')).toBe(skipped);
    expect(skipOnboardingRecord(skipped, '2026-10-26T03:00:00.000Z')).toBe(skipped);
  });

  it('throws when attempting to complete or skip an ineligible legacy account', () => {
    const legacy = createRecord({isEligible: false});
    expect(() => completeOnboardingRecord(legacy)).toThrow(/ineligible/);
    expect(() => skipOnboardingRecord(legacy)).toThrow(/ineligible/);
  });
});

describe('parseOnboardingRecord', () => {
  it('parses valid onboarding record', () => {
    const raw = {
      userId: validUserId,
      rolloutVersion: ONBOARDING_ROLLOUT_VERSION,
      isEligible: true,
      eligibleAt: '2026-10-26T00:00:00.000Z',
      completedAt: null,
      skippedAt: null,
    };
    expect(parseOnboardingRecord(raw)).toEqual(raw);
  });

  it('rejects invalid or non-object values', () => {
    expect(parseOnboardingRecord(null)).toBeNull();
    expect(parseOnboardingRecord(undefined)).toBeNull();
    expect(parseOnboardingRecord('string')).toBeNull();
    expect(parseOnboardingRecord(123)).toBeNull();
    expect(parseOnboardingRecord([])).toBeNull();
  });

  it('rejects malformed userId or empty rolloutVersion', () => {
    expect(parseOnboardingRecord({userId: 'bad', rolloutVersion: 'v1', isEligible: true})).toBeNull();
    expect(parseOnboardingRecord({userId: validUserId, rolloutVersion: '', isEligible: true})).toBeNull();
    expect(parseOnboardingRecord({userId: validUserId, rolloutVersion: 'v1', isEligible: 'true'})).toBeNull();
  });

  it('rejects invalid timestamp format', () => {
    expect(parseOnboardingRecord({
      userId: validUserId,
      rolloutVersion: 'v1',
      isEligible: true,
      eligibleAt: 'invalid-date',
    })).toBeNull();
  });

  it('rejects records with both completedAt and skippedAt set', () => {
    expect(parseOnboardingRecord({
      userId: validUserId,
      rolloutVersion: 'v1',
      isEligible: true,
      completedAt: '2026-10-26T01:00:00.000Z',
      skippedAt: '2026-10-26T01:00:00.000Z',
    })).toBeNull();
  });
});

describe('parseOnboardingDecisionResult', () => {
  it('parses valid applied decision result', () => {
    const raw = {
      outcome: 'applied',
      completedAt: '2026-10-26T02:00:00.000Z',
      skippedAt: null,
    };
    expect(parseOnboardingDecisionResult(raw)).toEqual(raw);
  });

  it('parses valid skipped decision result', () => {
    const raw = {
      outcome: 'applied',
      completedAt: null,
      skippedAt: '2026-10-26T02:00:00.000Z',
    };
    expect(parseOnboardingDecisionResult(raw)).toEqual(raw);
  });

  it('parses already-resolved and ineligible outcomes', () => {
    expect(parseOnboardingDecisionResult({outcome: 'already-resolved', completedAt: null, skippedAt: null})).toEqual({
      outcome: 'already-resolved',
      completedAt: null,
      skippedAt: null,
    });
    expect(parseOnboardingDecisionResult({outcome: 'ineligible', completedAt: null, skippedAt: null})).toEqual({
      outcome: 'ineligible',
      completedAt: null,
      skippedAt: null,
    });
  });

  it('rejects unknown outcome or invalid timestamps', () => {
    expect(parseOnboardingDecisionResult(null)).toBeNull();
    expect(parseOnboardingDecisionResult({outcome: 'bad-outcome'})).toBeNull();
    expect(parseOnboardingDecisionResult({outcome: 'applied', completedAt: 'bad-date'})).toBeNull();
  });
});

