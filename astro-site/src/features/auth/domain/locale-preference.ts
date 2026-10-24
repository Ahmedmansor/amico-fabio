import {isLocale, type Locale} from '../../../shared/config/languages.ts';

export type LocaleSource = 'follow_site' | 'explicit';
export interface AccountLocaleState {
  siteLocale: Locale;
  revision: number;
  email: {locale: Locale; source: LocaleSource} | null;
}
export type LocaleCommand = {
  requestId: string;
  expectedRevision: number;
} & ({kind: 'site' | 'email_explicit'; locale: Locale} | {kind: 'email_follow_site'});

export const isLocaleRequestId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const isRevision = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

/** Strict input boundary: ownership, consent and client timestamps are never commands. */
export function parseLocaleCommand(value: unknown): LocaleCommand | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const allowed = row.kind === 'email_follow_site'
    ? ['requestId', 'expectedRevision', 'kind'] : ['requestId', 'expectedRevision', 'kind', 'locale'];
  if (Object.keys(row).some(key => !allowed.includes(key))
    || !isLocaleRequestId(row.requestId) || !isRevision(row.expectedRevision)
    || row.expectedRevision >= Number.MAX_SAFE_INTEGER) return null;
  const identity = {requestId: row.requestId, expectedRevision: row.expectedRevision};
  if (row.kind === 'email_follow_site') return {...identity, kind: row.kind};
  if ((row.kind === 'site' || row.kind === 'email_explicit') && isLocale(row.locale))
    return {...identity, kind: row.kind, locale: row.locale};
  return null;
}

export function parseAccountLocaleState(value: unknown): AccountLocaleState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !['siteLocale', 'revision', 'email'].includes(key))
    || !isLocale(row.siteLocale) || !isRevision(row.revision)) return null;
  if (row.email === null) return {siteLocale: row.siteLocale, revision: row.revision, email: null};
  if (!row.email || typeof row.email !== 'object' || Array.isArray(row.email)) return null;
  const email = row.email as Record<string, unknown>;
  if (Object.keys(email).some(key => !['locale', 'source'].includes(key))
    || !isLocale(email.locale) || !['follow_site', 'explicit'].includes(email.source as string)) return null;
  if (email.source === 'follow_site' && email.locale !== row.siteLocale) return null;
  return {siteLocale: row.siteLocale, revision: row.revision,
    email: {locale: email.locale, source: email.source as LocaleSource}};
}

export type LocaleResult<T> = {ok: true; value: T}
  | {ok: false; reason: 'invalid-input' | 'unavailable' | 'failed' | 'missing-profile' | 'missing-preference'}
  | {ok: false; reason: 'conflict'; state: AccountLocaleState};
export interface LocaleConfirmation {state: AccountLocaleState; outcome: 'applied' | 'duplicate'}
/** Shared RPC/HTTP confirmation checks; an old duplicate reports current state. */
export function parseLocaleMutation(value: unknown, command: LocaleCommand): LocaleResult<LocaleConfirmation> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !['state', 'outcome'].includes(key))) return null;
  const state = parseAccountLocaleState(row.state);
  if (!state) return null;
  if (row.outcome === 'conflict') return state.revision !== command.expectedRevision
    ? {ok: false, reason: 'conflict', state} : null;
  if (row.outcome === 'applied' && (state.revision !== command.expectedRevision + 1
    || (command.kind === 'site' && state.siteLocale !== command.locale)
    || (command.kind === 'email_explicit' && (state.email?.source !== 'explicit' || state.email.locale !== command.locale))
    || (command.kind === 'email_follow_site' && state.email?.source !== 'follow_site'))) return null;
  if (row.outcome === 'duplicate' && state.revision <= command.expectedRevision) return null;
  return row.outcome === 'applied' || row.outcome === 'duplicate'
    ? {ok: true, value: {state, outcome: row.outcome}} : null;
}
export interface LocaleRepository {
  read(verifiedUserId: string): Promise<LocaleResult<AccountLocaleState>>;
  change(verifiedUserId: string, command: LocaleCommand): Promise<LocaleResult<LocaleConfirmation>>;
}

/** Pure policy only. Database serialization/idempotency are handled by the repository. */
export function nextLocaleState(state: AccountLocaleState, command: LocaleCommand): LocaleResult<AccountLocaleState> {
  if (command.expectedRevision !== state.revision) return {ok: false, reason: 'conflict', state};
  if (state.revision >= Number.MAX_SAFE_INTEGER) return {ok: false, reason: 'failed'};
  let siteLocale = state.siteLocale;
  let email = state.email;
  if (command.kind === 'site') {
    siteLocale = command.locale;
    if (email?.source === 'follow_site') email = {...email, locale: siteLocale};
  } else {
    if (!email) return {ok: false, reason: 'missing-preference'};
    email = command.kind === 'email_follow_site'
      ? {locale: siteLocale, source: 'follow_site'} : {locale: command.locale, source: 'explicit'};
  }
  return {ok: true, value: {siteLocale, revision: state.revision + 1, email}};
}
