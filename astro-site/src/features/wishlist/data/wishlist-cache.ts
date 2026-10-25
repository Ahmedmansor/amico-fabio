import { browserGuestStorage, readGuestWishlist } from './guest-storage.ts';
import { readCachedAuthProfile } from '../../auth/data/auth-cache.ts';

export const accountWishlistCachePrefix = 'fabio:wishlist:account:';

export interface CachedAccountWishlist {
  userId: string;
  ids: string[];
  savedAt: number;
}

function resolveStorage(customStorage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'length' | 'key'>): Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'length' | 'key'> | null {
  if (customStorage) return customStorage;
  return browserGuestStorage();
}

function accountKey(userId: string): string {
  return `${accountWishlistCachePrefix}${encodeURIComponent(userId)}:v1`;
}

export function saveAccountWishlistCache(userId: string, ids: readonly string[], storage?: Pick<Storage, 'setItem'>, now: () => number = Date.now): void {
  const store = storage ?? resolveStorage();
  if (!store || !userId?.trim()) return;
  try {
    const data: CachedAccountWishlist = {
      userId: userId.trim(),
      ids: [...new Set(ids.filter(id => typeof id === 'string' && id.trim()))],
      savedAt: now(),
    };
    store.setItem(accountKey(userId), JSON.stringify(data));
  } catch {
    /* Best effort display cache */
  }
}

export function readAccountWishlistCache(userId: string, storage?: Pick<Storage, 'getItem'>): string[] | null {
  const store = storage ?? resolveStorage();
  if (!store || !userId?.trim()) return null;
  try {
    const raw = store.getItem(accountKey(userId));
    if (!raw || raw.length > 32768) return null;
    const data = JSON.parse(raw);
    if (!data || data.userId !== userId.trim() || !Array.isArray(data.ids)) return null;
    return data.ids.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0);
  } catch {
    return null;
  }
}

export function clearAccountWishlistCache(userId?: string, storage?: Pick<Storage, 'removeItem' | 'length' | 'key'>): void {
  const store = storage ?? resolveStorage();
  if (!store) return;
  try {
    if (userId?.trim()) {
      store.removeItem(accountKey(userId));
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(accountWishlistCachePrefix)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) store.removeItem(k);
  } catch {
    /* Best effort. */
  }
}

export function readInitialWishlistIds(storage?: Pick<Storage, 'getItem' | 'length' | 'key' | 'setItem' | 'removeItem'>): { userId: string | null; ids: Set<string> } {
  const store = storage ?? resolveStorage();
  try {
    const cachedUser = readCachedAuthProfile(store ?? undefined);
    if (cachedUser?.userId) {
      const cachedAccountIds = readAccountWishlistCache(cachedUser.userId, store ?? undefined);
      if (cachedAccountIds !== null) {
        return { userId: cachedUser.userId, ids: new Set(cachedAccountIds) };
      }
    }
    const guest = readGuestWishlist(store ?? null);
    if (guest.ok) {
      return { userId: null, ids: new Set(guest.value) };
    }
  } catch {
    /* Safe fallback */
  }
  return { userId: null, ids: new Set() };
}
