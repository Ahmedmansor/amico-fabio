import type {SupabaseClient} from '@supabase/supabase-js';
import {isLocaleRequestId, parseLocaleCommand, parseAccountLocaleState, parseLocaleMutation,
  type AccountLocaleState, type LocaleRepository, type LocaleResult} from '../domain/locale-preference.ts';

function stateFromRow(row: Record<string, unknown>): AccountLocaleState | null {
  return parseAccountLocaleState({siteLocale: row.site_locale, revision: row.revision,
    email: row.email_locale === null && row.locale_source === null ? null
      : {locale: row.email_locale, source: row.locale_source}});
}

/** Inject a private backend client. Does not read environment variables or log responses. */
export function createLocaleRepository(client: Pick<SupabaseClient, 'rpc'> | null, timeoutMs: number): LocaleRepository {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error('[auth] Explicit locale request deadline required.');
  async function call(name: string, args: Record<string, unknown>) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const {data, error} = await client!.rpc(name, args).abortSignal(controller.signal);
      if (error || !Array.isArray(data) || data.length !== 1 || !data[0] || typeof data[0] !== 'object') return null;
      return data[0] as Record<string, unknown>;
    } catch {return null;} finally {clearTimeout(timer);}
  }
  const failed = (): LocaleResult<never> => ({ok: false, reason: 'failed'});
  return {
    async read(userId) {
      if (!isLocaleRequestId(userId)) return {ok: false, reason: 'invalid-input'};
      if (!client) return {ok: false, reason: 'unavailable'};
      const row = await call('read_account_locale', {p_user_id: userId});
      if (!row) return failed();
      if (row.outcome === 'missing-profile') return {ok: false, reason: 'missing-profile'};
      const state = stateFromRow(row);
      return row.outcome === 'read' && state ? {ok: true, value: state} : failed();
    },
    async change(userId, command) {
      if (!isLocaleRequestId(userId) || !parseLocaleCommand(command)) return {ok: false, reason: 'invalid-input'};
      if (!client) return {ok: false, reason: 'unavailable'};
      const row = await call('change_account_locale', {p_user_id: userId, p_request_id: command.requestId,
        p_expected_revision: command.expectedRevision, p_kind: command.kind,
        p_locale: command.kind === 'email_follow_site' ? null : command.locale});
      if (!row) return failed();
      if (row.outcome === 'missing-profile' || row.outcome === 'missing-preference' || row.outcome === 'invalid-input')
        return {ok: false, reason: row.outcome};
      return parseLocaleMutation({state: stateFromRow(row), outcome: row.outcome}, command) ?? failed();
    },
  };
}
