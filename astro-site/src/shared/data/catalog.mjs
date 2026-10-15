import { getTrips } from '../../features/tours/data/trips.mjs';
import { getPackages } from '../../features/packages/data/packages.mjs';
import { getAddons } from '../../features/booking/data/addons.mjs';
import { getGlobalSettings } from '../../features/home/data/settings.mjs';
import { getCatalogProvider } from './provider.mjs';
export async function getCatalog(provider = getCatalogProvider()) {
  const [trips, packages, addons, settings] = await Promise.all([getTrips(provider), getPackages(provider), getAddons(provider), getGlobalSettings(provider)]);
  return { trips, packages, addons, settings };
}
