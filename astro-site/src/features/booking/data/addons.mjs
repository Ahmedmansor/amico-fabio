import { getCatalogProvider } from '../../../shared/data/provider.mjs';
import { getTrips } from '../../tours/data/trips.mjs';
import { getPackages } from '../../packages/data/packages.mjs';
import { mapAddons } from '../domain/addons.ts';
import { supportedLocales } from '../../../shared/config/languages.ts';
const translations = {
  'ras_mohammed_white_island_vip/diving': {es:'Opción de buceo con botella',pt:'Opção de mergulho com garrafa',de:'Gerätetauchen als Zusatzoption'},
  'ras_mohammed_white_island_vip/photo': {es:'Fotos profesionales',pt:'Fotografias profissionais',de:'Professionelle Fotos'},
  'tiran_island_boat_vip/scarf': {es:'Pañuelo beduino',pt:'Lenço beduíno',de:'Beduinentuch'},
};
export async function getAddons(provider = getCatalogProvider()) {
  const [rows, trips, packages] = await Promise.all([provider.read('Trip_Addons'), getTrips(provider), getPackages(provider)]);
  return mapAddons(rows, [...trips, ...packages].map(record => record.id), ['it','en']).map(addon => {
    const labels = {...addon.labels};
    for (const locale of supportedLocales.filter(locale=>!['it','en'].includes(locale))) {
      const label = translations[`${addon.tripId}/${addon.id}`]?.[locale];
      if (!label) throw new Error(`[Trip_Addons:${addon.tripId}/${addon.id}] Missing translation for ${locale}.`);
      labels[locale] = label;
    }
    return {...addon, labels};
  });
}
