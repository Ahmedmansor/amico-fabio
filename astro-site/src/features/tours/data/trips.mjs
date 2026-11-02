import it from './content/it.json' with { type: 'json' };
import en from './content/en.json' with { type: 'json' };
import es from './content/es.json' with { type: 'json' };
import pt from './content/pt.json' with { type: 'json' };
import { defaultLocale, supportedLocales } from '../../../shared/config/languages.ts';
import { validateTranslations } from '../../../shared/i18n/validate.ts';
import { getCatalogProvider } from '../../../shared/data/provider.mjs';
import { assertCatalogAssets } from '../../../shared/data/catalog-assets.mjs';
import { mapTrips } from '../domain/tours.ts';
const dictionaries = { it, en, es, pt };
export async function getTrips(provider = getCatalogProvider()) {
  validateTranslations(dictionaries, supportedLocales, defaultLocale);
  const trips = mapTrips(await provider.read('Trips_Prices'), dictionaries, supportedLocales).map(trip=>{
    const english=trip.source.badge_en?.trim()||'';
    if(english && english!=='Top 🔥')throw new Error(`[trips:${trip.id}] Missing badge translation: ${english}.`);
    return {...trip,badges:{it:trip.source.badge_it||'',en:trip.source.badge_en||'',es:english?'Destacado 🔥':'',pt:english?'Destaque 🔥':''}};
  });
  assertCatalogAssets(trips);
  return trips;
}
