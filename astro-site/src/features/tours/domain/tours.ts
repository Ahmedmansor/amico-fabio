import { publishedRows, mapOffer, assertUniqueSlugs, type OfferDictionaries } from '../../../shared/domain/offers.ts';
import type { CsvRow } from '../../../shared/domain/csv.ts';
export function mapTrips(rows: CsvRow[], dictionaries: OfferDictionaries, locales: readonly string[]) {
  const trips = publishedRows(rows, 'trip_id', 'Trips_Prices').map(row => mapOffer(row, 'trip_id', 'trips', dictionaries, locales));
  assertUniqueSlugs(trips, 'Trips_Prices');
  return trips;
}
