import { googleSheetsProvider } from '../../../shared/data/google-sheets.mjs';
import { mapSettings } from '../domain/settings.ts';
import { supportedLocales } from '../../../shared/config/languages.ts';
export async function getGlobalSettings(provider = googleSheetsProvider) { return mapSettings(await provider.read('Global_Settings'), supportedLocales); }
