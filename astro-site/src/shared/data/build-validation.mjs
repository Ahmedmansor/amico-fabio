import { getCatalogProvider } from './provider.mjs';
import { getCatalog } from './catalog.mjs';
export function catalogValidation() {
  return { name: 'fabio-catalog-validation', hooks: {
    'astro:build:start': async ({ logger }) => {
      const provider = getCatalogProvider();
      provider.reset();
      const catalog = await getCatalog(provider);
      logger.info(`Validated live ${provider.name}: ${catalog.trips.length} trips, ${catalog.packages.length} packages, ${catalog.addons.length} addons, ${catalog.settings.length} settings.`);
    },
  } };
}
