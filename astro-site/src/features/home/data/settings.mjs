import { getCatalogProvider } from '../../../shared/data/provider.mjs';
import { mapSettings } from '../domain/settings.ts';
import { supportedLocales } from '../../../shared/config/languages.ts';
export async function getGlobalSettings(provider = getCatalogProvider()) { return mapSettings(await provider.read('Global_Settings'), supportedLocales); }
