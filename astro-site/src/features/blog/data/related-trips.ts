import { getTrips } from '../../tours/data/trips.mjs';
import type { BlogPost } from '../domain/models';
import { selectRelatedTrip } from '../domain/related-trip';

export async function getRelatedTrips(posts: readonly BlogPost[]) {
  const trips = posts.some(post => post.relatedTripIds.length) ? await getTrips() : [];
  return new Map(posts.map(post => [post.id, selectRelatedTrip(post.relatedTripIds, trips, post.lang)]));
}
