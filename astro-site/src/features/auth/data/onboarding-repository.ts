import type {SupabaseClient} from '@supabase/supabase-js';
import {isPreferenceRequestId} from '../../reminders/domain/preferences.ts';
import {
  parseOnboardingRecord,
  parseOnboardingDecisionResult,
  type AccountOnboardingRecord,
  type OnboardingDecisionResult,
  type OnboardingRepository,
  type OnboardingResult,
} from '../domain/onboarding.ts';

export function createOnboardingRepository(
  client: Pick<SupabaseClient, 'rpc'> | null,
  timeoutMs: number = 8000
): OnboardingRepository {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error('[onboarding] Explicit request deadline required.');
  }

  async function call(name: string, args: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    if (!client) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const {data, error} = await client.rpc(name, args).abortSignal(controller.signal);
      if (error || !Array.isArray(data) || data.length === 0 || !data[0] || typeof data[0] !== 'object') {
        return null;
      }
      return data[0] as Record<string, unknown>;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async read(userId: string): Promise<OnboardingResult<AccountOnboardingRecord | null>> {
      if (!isPreferenceRequestId(userId)) {
        return {ok: false, reason: 'invalid-input'};
      }
      if (!client) {
        return {ok: false, reason: 'unavailable'};
      }
      const row = await call('read_account_onboarding', {p_user_id: userId});
      if (!row) {
        return {ok: true, value: null};
      }
      const record = parseOnboardingRecord({
        userId: row.user_id,
        rolloutVersion: row.rollout_version,
        isEligible: row.is_eligible,
        eligibleAt: row.eligible_at,
        completedAt: row.completed_at,
        skippedAt: row.skipped_at,
      });
      return {ok: true, value: record};
    },

    async recordDecision(
      userId: string,
      decision: 'complete' | 'skip',
      version: string
    ): Promise<OnboardingResult<OnboardingDecisionResult>> {
      if (!isPreferenceRequestId(userId) || (decision !== 'complete' && decision !== 'skip') || !version) {
        return {ok: false, reason: 'invalid-input'};
      }
      if (!client) {
        return {ok: false, reason: 'unavailable'};
      }
      const row = await call('record_onboarding_decision', {
        p_user_id: userId,
        p_decision: decision,
        p_version: version,
      });
      if (!row) {
        return {ok: false, reason: 'failed'};
      }
      const result = parseOnboardingDecisionResult({
        outcome: row.outcome,
        completedAt: row.completed_at,
        skippedAt: row.skipped_at,
      });
      if (!result) {
        return {ok: false, reason: 'failed'};
      }
      return {ok: true, value: result};
    },
  };
}
