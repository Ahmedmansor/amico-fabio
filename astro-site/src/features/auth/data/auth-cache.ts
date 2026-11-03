import type { AccountSession } from '../domain/auth.ts';

export const authProfileCacheKey = 'fabio:auth:profile:v1';

export interface CachedAuthProfile {
  userId: string;
  profile: {
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  savedAt: number;
}

function resolveStorage(customStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'length' | 'key'>): Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'length' | 'key'> | null {
  if (customStorage) return customStorage;
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function saveCachedAuthProfile(session: AccountSession, storage?: Pick<Storage, 'setItem'>, now: () => number = Date.now): void {
  const store = storage ?? resolveStorage();
  if (!store || !session?.userId) return;
  try {
    const data: CachedAuthProfile = {
      userId: session.userId,
      profile: {
        displayName: session.profile?.displayName ?? null,
        email: session.profile?.email ?? null,
        avatarUrl: session.profile?.avatarUrl ?? null,
      },
      savedAt: now(),
    };
    store.setItem(authProfileCacheKey, JSON.stringify(data));
  } catch {
    /* Cache is best-effort display hint. */
  }
}

export function readCachedAuthProfile(storage?: Pick<Storage, 'getItem'>): CachedAuthProfile | null {
  const store = storage ?? resolveStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(authProfileCacheKey);
    if (!raw || raw.length > 2048) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data.userId !== 'string' || !data.userId.trim() || !data.profile || typeof data.profile !== 'object') {
      return null;
    }
    return {
      userId: data.userId.trim(),
      profile: {
        displayName: typeof data.profile.displayName === 'string' && data.profile.displayName.trim() ? data.profile.displayName.trim() : null,
        email: typeof data.profile.email === 'string' && data.profile.email.trim() ? data.profile.email.trim() : null,
        avatarUrl: typeof data.profile.avatarUrl === 'string' && data.profile.avatarUrl.trim() ? data.profile.avatarUrl.trim() : null,
      },
      savedAt: Number.isSafeInteger(data.savedAt) ? data.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function clearCachedAuthProfile(storage?: Pick<Storage, 'removeItem'>): void {
  const store = storage ?? resolveStorage();
  if (!store) return;
  try {
    store.removeItem(authProfileCacheKey);
  } catch {
    /* Best effort. */
  }
}

export function hasCachedAuthSession(storage?: Pick<Storage, 'length' | 'key' | 'getItem'>): boolean {
  const store = storage ?? resolveStorage();
  if (!store) return false;
  try {
    if (store.getItem(authProfileCacheKey)) return true;
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const val = store.getItem(key);
        if (val && val !== 'null' && val !== '{}') return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
