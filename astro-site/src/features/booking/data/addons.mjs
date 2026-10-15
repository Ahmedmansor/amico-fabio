import { getCatalogProvider } from '../../../shared/data/provider.mjs';
import { getTrips } from '../../tours/data/trips.mjs';
import { getPackages } from '../../packages/data/packages.mjs';
import { mapAddons } from '../domain/addons.ts';
import { supportedLocales } from '../../../shared/config/languages.ts';
export async function getAddons(provider = getCatalogProvider()) {
  const [rows, trips, packages] = await Promise.all([provider.read('Trip_Addons'), getTrips(provider), getPackages(provider)]);
  return mapAddons(rows, [...trips, ...packages].map(record => record.id), supportedLocales);
}
