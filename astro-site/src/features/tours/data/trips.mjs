import it from './content/it.json' with { type: 'json' };
import en from './content/en.json' with { type: 'json' };
import { defaultLocale, supportedLocales } from '../../../shared/config/languages.ts';
import { validateTranslations } from '../../../shared/i18n/validate.ts';
import { getCatalogProvider } from '../../../shared/data/provider.mjs';
import { assertCatalogAssets } from '../../../shared/data/catalog-assets.mjs';
import { mapTrips } from '../domain/tours.ts';
const dictionaries = { it, en };
export async function getTrips(provider = getCatalogProvider()) {
  validateTranslations(dictionaries, supportedLocales, defaultLocale);
  const trips = mapTrips(await provider.read('Trips_Prices'), dictionaries, supportedLocales);
  assertCatalogAssets(trips);
  return trips;
}
