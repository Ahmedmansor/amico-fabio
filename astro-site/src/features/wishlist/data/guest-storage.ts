import { normalizeWishlist, tripId } from '../domain/wishlist.ts';
import type { GuestEntry } from '../domain/merge.ts';

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

function validRevision(value: string): boolean {
  return value === '1' || /^v2:[0-9a-f-]{36}$/.test(value);
}

export function readGuestSnapshot(storage: GuestStorage | null): StorageResult<GuestEntry[]> {
  if (!storage) return { ok: false, reason: 'unavailable' };
  const entries: GuestEntry[] = [];
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (!key?.startsWith(guestWishlistPrefix)) continue;
      const value = storage.getItem(key);
      // A different tab can remove a key while this snapshot is being read.
      if (value === null) continue;
      if (!validRevision(value)) return { ok: false, reason: 'invalid-data' };
      try {
        const id = decodeURIComponent(key.slice(guestWishlistPrefix.length));
        if (itemKey(id) !== key) return { ok: false, reason: 'invalid-data' };
        entries.push({ id, revision: value });
      } catch {
        return { ok: false, reason: 'invalid-data' };
      }
    }
    return { ok: true, value: entries.sort((a, b) => a.id.localeCompare(b.id)) };
  } catch {
    return { ok: false, reason: 'read-failed' };
  }
}

export function readGuestWishlist(storage: GuestStorage | null): StorageResult<string[]> {
  const result = readGuestSnapshot(storage);
  return result.ok ? { ok: true, value: normalizeWishlist(result.value.map(entry => entry.id)) } : result;
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
    const existing = storage.getItem(key);
    if (existing !== null && !validRevision(existing)) return { ok: false, reason: 'invalid-data' };
    const revision = existing ?? `v2:${crypto.randomUUID()}`;
    if (saved) storage.setItem(key, revision);
    else storage.removeItem(key);
    const persisted = storage.getItem(key);
    if (persisted !== (saved ? revision : null)) return { ok: false, reason: 'write-failed' };
    return { ok: true, value: saved };
  } catch {
    return { ok: false, reason: 'write-failed' };
  }
}

/** Call under the shared guest lock before an account merge snapshots legacy rows. */
export function promoteGuestSnapshot(storage: GuestStorage | null): StorageResult<GuestEntry[]> {
  const result = readGuestSnapshot(storage);
  if (!result.ok || !storage) return result;
  try {
    for (const entry of result.value) if (entry.revision === '1') {
      const key = itemKey(entry.id);
      const revision = `v2:${crypto.randomUUID()}`;
      storage.setItem(key, revision);
      if (storage.getItem(key) !== revision) return { ok: false, reason: 'write-failed' };
    }
    return readGuestSnapshot(storage);
  } catch { return { ok: false, reason: 'write-failed' }; }
}

/** Caller must hold the shared guest lock. Recheck before each conditional delete. */
export function removeGuestRevision(storage: GuestStorage | null, entry: GuestEntry): StorageResult<boolean> {
  if (!storage) return { ok: false, reason: 'unavailable' };
  try {
    const key = itemKey(entry.id);
    if (entry.revision === '1' || storage.getItem(key) !== entry.revision) return { ok: true, value: false };
    storage.removeItem(key);
    if (storage.getItem(key) !== null) return { ok: false, reason: 'write-failed' };
    return { ok: true, value: true };
  } catch { return { ok: false, reason: 'write-failed' }; }
}
