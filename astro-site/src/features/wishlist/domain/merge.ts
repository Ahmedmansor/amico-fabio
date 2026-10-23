import { normalizeWishlist } from './wishlist.ts';

export interface GuestEntry { id: string; revision: string }
export interface MergeIdentity { userId: string; generation: number }

/** Union only: merging a guest snapshot never replaces or deletes account rows. */
export function planGuestMerge(guest: readonly GuestEntry[], account: readonly string[], published: readonly string[]) {
  const existing = new Set(normalizeWishlist(account));
  const available = new Set(normalizeWishlist(published));
  const requested = normalizeWishlist(guest.map(entry => entry.id));
  return {
    insert: requested.filter(id => available.has(id) && !existing.has(id)),
    retained: requested.filter(id => !available.has(id) && !existing.has(id)),
  };
}

/** Confirm both identity and the exact saved revision; legacy `1` is ambiguous. */
export function confirmedGuestCleanup(
  snapshot: readonly GuestEntry[], current: readonly GuestEntry[], confirmed: readonly string[],
  captured: MergeIdentity, active: MergeIdentity | null,
): GuestEntry[] {
  if (!active || captured.userId !== active.userId || captured.generation !== active.generation) return [];
  const saved = new Map(current.map(entry => [entry.id, entry.revision]));
  const acknowledged = new Set(normalizeWishlist(confirmed));
  return snapshot.filter(entry => entry.revision !== '1' && acknowledged.has(entry.id)
    && saved.get(entry.id) === entry.revision).map(entry => ({ ...entry }));
}
