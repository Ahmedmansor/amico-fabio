export interface CachedOnboardingEntry {
  userId: string;
  rolloutVersion: string;
  status: 'already-resolved' | 'completed' | 'skipped' | 'ineligible';
  reason: string;
  timestamp: number;
}

function resolveStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    if (typeof window === 'undefined') return null;
    const store = window.localStorage;
    if (!store) return null;
    const probe = 'fabio:auth:storage-test';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export function getOnboardingCacheKey(userId: string, rolloutVersion: string): string {
  return `fabio:auth:onboarding:${encodeURIComponent(userId)}:${encodeURIComponent(rolloutVersion)}:v1`;
}

export function readCachedOnboarding(
  userId: string,
  rolloutVersion: string,
  maxAgeMsOrStorage?: number | Storage,
  nowOrStorage?: number | Storage,
  explicitStorage?: Storage
): CachedOnboardingEntry | null {
  if (!userId || !rolloutVersion) return null;

  let maxAgeMs = 300_000;
  let now = Date.now();
  let storage: Storage | undefined = explicitStorage;

  if (typeof maxAgeMsOrStorage === 'number') {
    maxAgeMs = maxAgeMsOrStorage;
    if (typeof nowOrStorage === 'number') {
      now = nowOrStorage;
    } else if (nowOrStorage && typeof (nowOrStorage as Storage).getItem === 'function') {
      storage = nowOrStorage as Storage;
    }
  } else if (maxAgeMsOrStorage && typeof (maxAgeMsOrStorage as Storage).getItem === 'function') {
    storage = maxAgeMsOrStorage as Storage;
  }

  const store = resolveStorage(storage);
  if (!store) return null;
  try {
    const raw = store.getItem(getOnboardingCacheKey(userId, rolloutVersion));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedOnboardingEntry>;
    if (
      parsed &&
      parsed.userId === userId &&
      parsed.rolloutVersion === rolloutVersion &&
      typeof parsed.status === 'string' &&
      ['already-resolved', 'completed', 'skipped', 'ineligible'].includes(parsed.status) &&
      typeof parsed.reason === 'string' &&
      parsed.reason !== 'skipped-locally' && // Reject unconfirmed local skips as cache miss
      typeof parsed.timestamp === 'number' &&
      now - parsed.timestamp <= maxAgeMs &&
      now >= parsed.timestamp - 60_000
    ) {
      return parsed as CachedOnboardingEntry;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCachedOnboarding(
  entry: Omit<CachedOnboardingEntry, 'timestamp'> & { timestamp?: number },
  storage?: Storage
): void {
  if (!entry.userId || !entry.rolloutVersion) return;
  // Never save unconfirmed local skips to durable cache
  if (entry.reason === 'skipped-locally') return;
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    const record: CachedOnboardingEntry = {
      userId: entry.userId,
      rolloutVersion: entry.rolloutVersion,
      status: entry.status,
      reason: entry.reason,
      timestamp: entry.timestamp ?? Date.now(),
    };
    store.setItem(getOnboardingCacheKey(entry.userId, entry.rolloutVersion), JSON.stringify(record));
  } catch {
    // Storage quota or denied; safe to continue without cache.
  }
}

export function clearCachedOnboarding(
  userId: string,
  rolloutVersion?: string,
  storage?: Storage
): void {
  const store = resolveStorage(storage);
  if (!store) return;
  try {
    if (rolloutVersion) {
      store.removeItem(getOnboardingCacheKey(userId, rolloutVersion));
    } else {
      const prefix = `fabio:auth:onboarding:${encodeURIComponent(userId)}:`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key && key.startsWith(prefix)) keysToRemove.push(key);
      }
      for (const key of keysToRemove) store.removeItem(key);
    }
  } catch {
    // Ignore storage clear failure
  }
}
