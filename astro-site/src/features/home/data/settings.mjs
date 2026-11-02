import { getCatalogProvider } from '../../../shared/data/provider.mjs';
import { mapSettings } from '../domain/settings.ts';
import { supportedLocales } from '../../../shared/config/languages.ts';
const translations = { promo_banner: { es: '¡Oferta especial de Año Nuevo! 🎄', pt: 'Oferta especial de Ano Novo! 🎄' } };
export async function getGlobalSettings(provider = getCatalogProvider()) {
  return mapSettings(await provider.read('Global_Settings'), ['it', 'en']).map(setting => {
    const values = {...setting.values};
    for (const locale of supportedLocales.filter(locale => !['it','en'].includes(locale))) {
      const value = translations[setting.key]?.[locale];
      if (!value) throw new Error(`[Global_Settings:${setting.key}] Missing translation for ${locale}.`);
      values[locale] = value;
    }
    return {...setting, values};
  });
}
