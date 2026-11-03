import {catalogSlug} from "../../../shared/domain/catalog-routes";
import type { Locale } from '../../../shared/config/languages';

export interface ReferencedTrip { id: string; slug: string; poster: string; text: Record<string, { title: string; route_slug?: unknown }> }
export interface RelatedTrip { id: string; title: string; poster: string; url: string }

/** Catalog input is already published by its owning feature's data function. */
export function selectRelatedTrip(ids: readonly string[], published: readonly ReferencedTrip[], lang: Locale): RelatedTrip | undefined {
  const byId = new Map(published.map(trip => [trip.id, trip]));
  for (const id of ids) if (!byId.has(id)) throw new Error(`[blog] Unknown or unpublished relatedTripIds entry: ${id}.`);
  for (const id of ids) {
    const trip = byId.get(id)!;
    const title = trip.text[lang]?.title;
    if (title?.trim()) return { id, title, poster: trip.poster, url: `/${lang}/tours/${catalogSlug(trip,lang)}/` };
  }
}
