import { publishedRows, mapOffer, assertUniqueSlugs, normalizeId, type Offer, type OfferDictionaries } from '../../../shared/domain/offers.ts';
import type { CsvRow } from '../../../shared/domain/csv.ts';
export interface Package extends Offer { includedTripIds: string[] }
export function mapPackages(rows: CsvRow[], trips: readonly Offer[], dictionaries: OfferDictionaries, locales: readonly string[]): Package[] {
  const tripIds = new Set(trips.map(trip => trip.id));
  const packages = publishedRows(rows, 'package_id', 'Packages').map(row => {
    const offer = mapOffer(row, 'package_id', 'packages', dictionaries, locales);
    const includedTripIds = (row.included_trip_ids || '').split(',').map(id => normalizeId(id)).filter(Boolean);
    for (const trip of includedTripIds) if (!tripIds.has(trip)) throw new Error(`[Packages:${offer.id}] Unknown included trip ${trip}.`);
    if (new Set(includedTripIds).size !== includedTripIds.length) throw new Error(`[Packages:${offer.id}] Duplicate included trip ID.`);
    return { ...offer, includedTripIds };
  });
  assertUniqueSlugs(packages, 'Packages');
  return packages;
}
