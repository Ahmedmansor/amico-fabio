import { normalizeWishlist, tripId } from '../domain/wishlist.ts';

export const guestWishlistPrefix = 'fabio:wishlist:v1:trip:';

export interface GuestStorage {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type StorageResult<T> = { ok: true; value: T } | {
  ok: false; reason: 'unavailable' | 'invalid-data' | 'read-failed' | 'write-failed';
};

function itemKey(id: string): string {
  return guestWishlistPrefix + encodeURIComponent(tripId(id));
}

/** Resolve localStorage at the point of use: accessing the getter can itself throw. */
export function browserGuestStorage(): GuestStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readGuestWishlist(storage: GuestStorage | null): StorageResult<string[]> {
  if (!storage) return { ok: false, reason: 'unavailable' };
  const ids: string[] = [];
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (!key?.startsWith(guestWishlistPrefix)) continue;
      const value = storage.getItem(key);
      // A different tab can remove a key while this snapshot is being read.
      if (value === null) continue;
      if (value !== '1') return { ok: false, reason: 'invalid-data' };
      try {
        const id = decodeURIComponent(key.slice(guestWishlistPrefix.length));
        if (itemKey(id) !== key) return { ok: false, reason: 'invalid-data' };
        ids.push(id);
      } catch {
        return { ok: false, reason: 'invalid-data' };
      }
    }
    return { ok: true, value: normalizeWishlist(ids) };
  } catch {
    return { ok: false, reason: 'read-failed' };
  }
}

/** One key per tour avoids overwriting another tab's unrelated saved tours.
 * Same-tour writes follow storage's last completed operation; no stale list rewrite.
 * Report success only after the storage operation and read-back succeed.
 */
export function saveGuestFavorite(
  storage: GuestStorage | null, id: string, saved: boolean,
): StorageResult<boolean> {
  let key: string;
  try {
    key = itemKey(id);
  } catch {
    return { ok: false, reason: 'invalid-data' };
  }
  if (!storage) return { ok: false, reason: 'unavailable' };
  try {
    if (saved) storage.setItem(key, '1');
    else storage.removeItem(key);
    const persisted = storage.getItem(key);
    if (persisted !== (saved ? '1' : null)) return { ok: false, reason: 'write-failed' };
    return { ok: true, value: saved };
  } catch {
    return { ok: false, reason: 'write-failed' };
  }
}
