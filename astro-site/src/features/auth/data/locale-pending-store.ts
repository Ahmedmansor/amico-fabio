import {isLocaleRequestId, parseLocaleCommand} from '../domain/locale-preference.ts';
import type {LocalePendingStore, PendingLocaleIntent} from './locale-coordinator.ts';

/** Inject per-tab sessionStorage, not shared localStorage, so another tab cannot
 * overwrite its pending intent. No bearer, session credentials, consent or email. */
export function createLocalePendingStore(options: {
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  now: () => number;
  maxAgeMs: number;
}): LocalePendingStore {
  if (!Number.isSafeInteger(options.maxAgeMs) || options.maxAgeMs < 1) throw new Error('[auth] Pending intent lifetime required.');
  function key(userId: string) {
    if (!isLocaleRequestId(userId)) throw new Error('[auth] Account-scoped intent required.');
    return `fabio:locale-pending:v1:${userId}`;
  }
  function parse(value: unknown): PendingLocaleIntent | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const row = value as Record<string, unknown>;
    if (Object.keys(row).some(field => !['intent', 'command', 'recoveryAttempted'].includes(field))
      || (row.recoveryAttempted !== undefined && typeof row.recoveryAttempted !== 'boolean')
      || !row.intent || typeof row.intent !== 'object' || Array.isArray(row.intent)) return null;
    const intent = row.intent as Record<string, unknown>;
    if (Object.keys(intent).some(field => !['kind', 'locale'].includes(field))) return null;
    const checked = parseLocaleCommand({...intent, requestId: '00000000-0000-4000-8000-000000000000', expectedRevision: 0});
    const command = row.command === null ? null : parseLocaleCommand(row.command);
    if (!checked || (row.command !== null && !command)) return null;
    return {intent: checked.kind === 'email_follow_site' ? {kind: checked.kind}
      : {kind: checked.kind, locale: checked.locale}, command, recoveryAttempted: row.recoveryAttempted ?? false};
  }
  return {
    read(userId) {
      const entryKey = key(userId);
      try {
        const raw = options.storage.getItem(entryKey);
        if (!raw) return null;
        if (raw.length > 2048) {options.storage.removeItem(entryKey); return null;}
        const row = JSON.parse(raw);
        const age = options.now() - row.savedAt;
        const value = parse(row.value);
        if (row.version !== 1 || Object.keys(row).some(field => !['version', 'savedAt', 'value'].includes(field))
          || !Number.isSafeInteger(row.savedAt) || age < 0 || age > options.maxAgeMs || !value) {
          options.storage.removeItem(entryKey); return null;
        }
        return value;
      } catch {return null;}
    },
    write(userId, value) {
      const entryKey = key(userId), safe = parse(value);
      if (!safe) return false;
      try {options.storage.setItem(entryKey, JSON.stringify({version: 1, savedAt: options.now(), value: safe})); return true;}
      catch {return false;}
    },
    remove(userId) {options.storage.removeItem(key(userId));},
  };
}
