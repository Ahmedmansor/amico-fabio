import { expect, it } from 'vitest';
import { selectRelatedTrip, type ReferencedTrip } from '../related-trip';
const a: ReferencedTrip = { id: 'stable-a', slug: 'route-a', poster: '/a.webp', text: { it: { title: 'Titolo A',route_slug:'titolo-a' }, en: { title: 'Title A',route_slug:'title-a' } } };
const b: ReferencedTrip = { ...a, id: 'stable-b', slug: 'route-b' };
it('uses explicit order, stable IDs and actual locale title with no prices', () => {
  expect(selectRelatedTrip([b.id, a.id], [a,b], 'en')).toEqual({ id: b.id, title: 'Title A', poster: '/a.webp', url: '/en/tours/title-a/' });
  expect(selectRelatedTrip([a.id], [a], 'it')?.title).toBe('Titolo A');
});
it('does not invent a missing language and selects the next eligible configured trip', () => {
  expect(selectRelatedTrip([a.id], [{ ...a, text: {} }], 'en')).toBeUndefined();
  expect(selectRelatedTrip([a.id, b.id], [{ ...a, text: {} },b], 'en')?.id).toBe(b.id);
});
it('rejects unknown or hidden references even after a valid first reference', () => {
  expect(() => selectRelatedTrip([a.id, 'hidden'], [a], 'it')).toThrow('Unknown or unpublished relatedTripIds entry: hidden');
  expect(selectRelatedTrip([], [], 'en')).toBeUndefined();
});
