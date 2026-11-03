import { describe, expect, it } from 'vitest';
import { favoriteIdentity, favoriteKey, normalizeWishlist, setFavorite, tripId } from '../wishlist';

describe('guest wishlist identity and explicit actions', () => {
  it('separates tours and packages with equal IDs and roundtrips encoded package IDs', () => {
    const trip = favoriteKey('trip', 'same');
    const pack = favoriteKey('package', 'same');
    expect(normalizeWishlist([trip, pack])).toHaveLength(2);
    expect(setFavorite([trip, pack], pack, false)).toEqual([trip]);
    expect(favoriteIdentity(trip)).toEqual({ kind: 'trip', id: 'same' });
    expect(favoriteIdentity(pack)).toEqual({ kind: 'package', id: 'same' });
    expect(favoriteIdentity(favoriteKey('package', 'abc:/% é'))).toEqual({ kind: 'package', id: 'abc:/% é' });
    expect(() => favoriteKey('trip', 'package:reserved')).toThrow(/Reserved/);
    expect(() => favoriteIdentity('package:')).toThrow();
    expect(() => favoriteIdentity('package:%ZZ')).toThrow();
  });
  it('deduplicates stable IDs without lowercasing or interpreting slugs', () => {
    expect(normalizeWishlist([' trip_B ', 'trip_A', 'trip_B', 'Trip_A']))
      .toEqual(['Trip_A', 'trip_A', 'trip_B']);
  });
  it('rejects missing identities instead of manufacturing one', () => {
    for (const value of [null, undefined, '', '  ', 7, {}]) {
      expect(() => tripId(value)).toThrow(/stable trip ID/);
    }
  });
  it('repeated saves/removals preserve the desired state and do not mutate input', () => {
    const original = Object.freeze(['a', 'b']);
    expect(setFavorite(setFavorite(original, 'c', true), 'c', true)).toEqual(['a', 'b', 'c']);
    expect(setFavorite(setFavorite(original, 'a', false), 'a', false)).toEqual(['b']);
    expect(original).toEqual(['a', 'b']);
  });
});
