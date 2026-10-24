import { favoriteIdentity, favoriteKey, normalizeWishlist } from '../domain/wishlist.ts';
import type { GuestEntry } from '../domain/merge.ts';

export const guestWishlistPrefix = 'fabio:wishlist:v1:trip:';
export const guestPackagePrefix = 'fabio:wishlist:v1:package:';
const acknowledgementPrefix = 'fabio:wishlist:ack:v1:';

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
  const item = favoriteIdentity(id);
  return (item.kind === 'trip' ? guestWishlistPrefix : guestPackagePrefix) + encodeURIComponent(item.id);
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
      const kind = key?.startsWith(guestWishlistPrefix) ? 'trip' : key?.startsWith(guestPackagePrefix) ? 'package' : null;
      if (!key || !kind) continue;
      const value = storage.getItem(key);
      // A different tab can remove a key while this snapshot is being read.
      if (value === null) continue;
      if (!validRevision(value)) return { ok: false, reason: 'invalid-data' };
      try {
        const prefix = kind === 'trip' ? guestWishlistPrefix : guestPackagePrefix;
        const id = favoriteKey(kind, decodeURIComponent(key.slice(prefix.length)));
        if (itemKey(id) !== key) return { ok: false, reason: 'invalid-data' };
        if (value !== '1' && storage.getItem(acknowledgementPrefix + value) === '1') continue;
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

/** One key per typed item avoids overwriting another tab's unrelated favorites.
 * Same-item writes follow storage's last completed operation; no stale list rewrite.
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
    const acknowledged = existing !== null && storage.getItem(acknowledgementPrefix + existing) === '1';
    const revision = existing !== null && !acknowledged ? existing : `v2:${crypto.randomUUID()}`;
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

/** Logical removal by revision: never deletes a concurrent newer save, even from an old tab. */
export function removeGuestRevision(storage: GuestStorage | null, entry: GuestEntry): StorageResult<boolean> {
  if (!storage) return { ok: false, reason: 'unavailable' };
  try {
    const key = itemKey(entry.id);
    if (entry.revision === '1' || storage.getItem(key) !== entry.revision) return { ok: true, value: false };
    storage.setItem(acknowledgementPrefix + entry.revision, '1');
    if (storage.getItem(acknowledgementPrefix + entry.revision) !== '1') return { ok: false, reason: 'write-failed' };
    return { ok: true, value: true };
  } catch { return { ok: false, reason: 'write-failed' }; }
}
