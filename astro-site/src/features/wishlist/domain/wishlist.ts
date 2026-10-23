/** Stable catalog IDs only. Slugs, prices and account data do not belong here. */
export function tripId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('[wishlist] A nonblank stable trip ID is required.');
  }
  return value.trim();
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
