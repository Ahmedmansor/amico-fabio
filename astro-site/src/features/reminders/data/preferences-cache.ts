import {parseEmailPreference, type EmailPreference} from '../domain/preferences.ts';

export interface CachedPreferenceEntry {
  userId: string;
  preference: EmailPreference | null;
  savedAt: number;
}

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    if (typeof window === 'undefined') return null;
    const store = window.localStorage;
    if (!store) return null;
    const probe = 'fabio:reminders:storage-test';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export function getPreferenceCacheKey(userId: string): string {
  return `fabio:reminders:preference:${encodeURIComponent(userId)}:v1`;
}

/**
 * Returns:
 * - `undefined` if cache miss, expired, or invalid
 * - `EmailPreference | null` if cache hit (null means account has no preference record yet)
 */
export function readCachedPreference(
  userId: string,
  maxAgeMs = 300_000,
  now = Date.now(),
  storage?: Storage
): EmailPreference | null | undefined {
  if (!userId) return undefined;
  const store = resolveStorage(storage);
  if (!store) return undefined;
  try {
    const raw = store.getItem(getPreferenceCacheKey(userId));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<CachedPreferenceEntry>;
    if (
      parsed &&
      parsed.userId === userId &&
      typeof parsed.savedAt === 'number' &&
      now - parsed.savedAt <= maxAgeMs &&
      now >= parsed.savedAt - 60_000
    ) {
      if (parsed.preference === null) {
        return null;
      }
      const validated = parseEmailPreference(parsed.preference);
      if (validated !== null) {
        return validated;
      }
      // Invalid preference content (e.g. enabled: "yes", locale: "zz") -> Cache Miss
      return undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function saveCachedPreference(
  userId: string,
  preference: EmailPreference | null,
  now = Date.now(),
  storage?: Storage
): void {
  if (!userId) return;
  if (preference !== null && parseEmailPreference(preference) === null) return;
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    const record: CachedPreferenceEntry = {
      userId,
      preference,
      savedAt: now,
    };
    store.setItem(getPreferenceCacheKey(userId), JSON.stringify(record));
  } catch {
    // Storage quota or denied; safe to continue without cache
  }
}

export function clearCachedPreference(userId: string, storage?: Storage): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    store.removeItem(getPreferenceCacheKey(userId));
  } catch {
    // Ignore clear error
  }
}

export function clearAllCachedPreferences(storage?: Storage): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    const prefix = 'fabio:reminders:preference:';
    const keysToRemove: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith(prefix)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) store.removeItem(key);
  } catch {
    // Ignore clear error
  }
}
