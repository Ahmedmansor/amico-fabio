/** Stable catalog IDs only. Slugs, prices and account data do not belong here. */
export function tripId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('[wishlist] A nonblank stable trip ID is required.');
  }
  return value.trim();
}

export type FavoriteKind = 'trip' | 'package';
/** Tours retain their historical keys; package keys have a reserved namespace. */
export function favoriteKey(kind: FavoriteKind, value: unknown): string {
  const id = tripId(value);
  if (kind === 'package') return `package:${encodeURIComponent(id)}`;
  if (id.startsWith('package:')) throw new Error(`[wishlist] Reserved trip ID namespace: ${id}.`);
  return id;
}
export function favoriteIdentity(key: string): { kind: FavoriteKind; id: string } {
  const value = tripId(key);
  if (!value.startsWith('package:')) return { kind: 'trip', id: value };
  const id = tripId(decodeURIComponent(value.slice(8)));
  if (favoriteKey('package', id) !== value) throw new Error('[wishlist] Invalid package identity.');
  return { kind: 'package', id };
}

export function normalizeWishlist(values: readonly unknown[]): string[] {
  return [...new Set(values.map(tripId))].sort();
}

/** An explicit desired state makes repeated actions idempotent. */
export function setFavorite(ids: readonly string[], id: string, saved: boolean): string[] {
  const normalized = normalizeWishlist(ids);
  const selected = tripId(id);
  return saved
    ? normalizeWishlist([...normalized, selected])
    : normalized.filter(value => value !== selected);
}
