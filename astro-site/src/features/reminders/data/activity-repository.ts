import type {SupabaseClient} from '@supabase/supabase-js';
import {parseReminderActivity, type ReminderActivityRepository} from '../domain/activity.ts';
import {isPreferenceRequestId} from '../domain/preferences.ts';

/** Server-only private-RPC reader; not mounted and not a fallback to row timestamps. */
export function createReminderActivityRepository(client: Pick<SupabaseClient, 'rpc'> | null, timeoutMs: number): ReminderActivityRepository {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error('[reminders] Activity deadline required.');
  return {async read(userId) {
    if (!isPreferenceRequestId(userId)) return {ok: false, reason: 'invalid-input'};
    if (!client) return {ok: false, reason: 'unavailable'};
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const {data, error} = await client.rpc('read_wishlist_reminder_activity', {p_user_id: userId}).abortSignal(controller.signal);
      if (error || !Array.isArray(data) || data.length > 1) return {ok: false, reason: 'failed'};
      if (!data.length) return {ok: true, value: null};
      const row = data[0];
      if (!row || typeof row !== 'object') return {ok: false, reason: 'failed'};
      const activity = parseReminderActivity({favoriteCount: row.favorite_count, revision: row.revision,
        lastAdditionAt: row.last_addition_at === null ? null : typeof row.last_addition_at === 'string' ? Date.parse(row.last_addition_at) : NaN});
      return activity ? {ok: true, value: activity} : {ok: false, reason: 'failed'};
    } catch {return {ok: false, reason: 'failed'};} finally {clearTimeout(timer);}
  }};
}
