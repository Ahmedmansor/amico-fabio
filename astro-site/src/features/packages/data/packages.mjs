import it from './content/it.json' with { type: 'json' };
import en from './content/en.json' with { type: 'json' };
import { defaultLocale, supportedLocales } from '../../../shared/config/languages.ts';
import { validateTranslations } from '../../../shared/i18n/validate.ts';
import { getCatalogProvider } from '../../../shared/data/provider.mjs';
import { assertCatalogAssets } from '../../../shared/data/catalog-assets.mjs';
import { getTrips } from '../../tours/data/trips.mjs';
import { mapPackages } from '../domain/packages.ts';
const dictionaries = { it, en };
export async function getPackages(provider = getCatalogProvider()) {
  validateTranslations(dictionaries, supportedLocales, defaultLocale);
  const [rows, trips] = await Promise.all([provider.read('Packages'), getTrips(provider)]);
  const packages = mapPackages(rows, trips, dictionaries, supportedLocales);
  assertCatalogAssets(packages);
  return packages;
}
