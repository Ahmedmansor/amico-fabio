import { googleSheetsProvider } from './google-sheets.mjs';
import { getCatalog } from './catalog.mjs';
export function catalogValidation() {
  return { name: 'fabio-catalog-validation', hooks: {
    'astro:build:start': async ({ logger }) => {
      googleSheetsProvider.reset();
      const catalog = await getCatalog();
      logger.info(`Validated live Google Sheets: ${catalog.trips.length} trips, ${catalog.packages.length} packages, ${catalog.addons.length} addons, ${catalog.settings.length} settings.`);
    },
  } };
}
