# Data layer and legacy business compatibility

Google Sheets remains the production source. Feature callers use `getTrips()`,
`getPackages()`, `getAddons()`, and `getGlobalSettings()` from their respective
`data/` layers. `getCatalog()` coordinates these public functions.

The provider boundary is `src/shared/data/google-sheets.mjs`. A provider exposes
`read(name)` returning CSV-shaped records and `reset()` clearing its current
build requests. Replacing that provider changes external access in one place;
feature domain functions and presentation do not fetch Google URLs directly.
The fixture-provider test proves the functions can work with a different source.

## Preserved behavior

- Discounts are used for booking when supplied, otherwise base prices apply.
- Blank child prices map to zero; blank `min_pax` maps to one. The owner explicitly
  requested these legacy defaults. Raw source fields remain on each mapped record.
- Exact existing IDs and legacy aliases are retained. `slug` is a separate field
  initially equal to the normalized ID and shared across language versions.
- Only active records enter the published catalog. The existing TRUE/1 activation
  forms are preserved; inactive empty rows are not fabricated into records.
- Packages can have no included-trip IDs, as several real legacy packages do.
- Addons retain their current labels and fixed price values. No total-price or
  WhatsApp message behavior was implemented or changed in this task.
- Banner activation uses `is_active === TRUE`; dates remain metadata rather
  than a new expiry policy. The sheet's WhatsApp setting is returned unchanged,
  but does not override the contact config used by the real legacy site.
- Changing Google Sheets values requires a new production build for static pages.

## Validation and access

The Astro `astro:build:start` hook fetches and validates all four live sources.
There is a five-second request timeout, matching the old source timeout. Errors
fail the build with their source/record context rather than publishing empty
fallback records. Promises are reused only within the current provider/build;
the build hook resets them before fetching. No sessionStorage or disk fallback
is used. Future pages should obtain one catalog per generation pass and share
it across routes rather than construct their own providers.

Validation covers CSV columns, required fields, duplicate IDs/slugs, numeric
prices, translated titles/descriptions, local posters, package included-trip
references, addon parent references/labels, and duplicate settings. The explicit
legacy defaults above are allowed; other missing required data is rejected.

Pure CSV parsing and offer utilities live under `src/shared/domain/`, and
feature domain functions import only pure domain utilities/types. External
fetching and filesystem checks remain in `data/`. Domain tests need no network.
Supported languages are passed from the single language config to domain code.

Trip/package dictionaries and images were copied from the legacy source without
new content. Catalog images are source assets under `src/shared/assets/catalog/`,
ready for Astro image optimization when their presentation tasks are implemented.
They are not all published by the current legal-page build.

## Reproduce

From `astro-site/`, with network access for the live-data commands:

```sh
npm test
npx astro check
npm run build
node scripts/verify-catalog.mjs
```

The domain tests include a direct comparison of every mapped trip/package
price and minimum against `BookingManager.utils.getPrices()` executed from
the real legacy source. Provider tests cover failure propagation, cache reset,
source substitution, and image validation.

The CSVs under `qa/data/fixtures/` are public-source snapshots captured for tests
on October 13, 2026. They are not a production cache, source override, or fallback.
The extraction script is a one-time migration tool, not a runtime dependency.
No additional library was installed. Booking's planned Vitest work is separate.

No page UI was changed in this task, so no new visual comparison was needed.
The production routes remain the setup page and both legal pages.
