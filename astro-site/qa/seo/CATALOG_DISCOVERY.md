# Catalog discovery — 2026-11-03

Scope: ordinary HTML links beside existing included-trip modal buttons; unique
Explore titles/descriptions for Sharm, Cairo and Luxor/Aswan in all five published
languages. Existing general metadata and translated discovery labels are reused.
No price, catalog association, consent, indexing flag or deployment changes.

Verification on Node 24.21.0:

- `node --test src/features/explore/domain/__tests__/explore.test.mjs`: 7 passed,
  0 failed, including missing destination metadata and unique locale metadata.
- `npx astro check`: 714 files, 0 errors, 0 warnings, 0 hints.
- `npm run build`: 248 pages, complete; canonical/reciprocal hreflang checked for
  230 indexable pages. Existing Browserslist dataset-age advisory remains.
- Initial sandboxed check/build could not reach Supabase. Both commands passed
  with network access; build validated 22 trips, 14 packages, 3 addons, 1 settings.
- `node qa/seo/catalog-discovery.mjs`: 20 generated Explore metadata pages,
  70 package pages, 100 included-tour links with existing localized targets.
- Browser check on `http://127.0.0.1:4334`, IT/EN at 375 and 1280 pixels:
  existing modal opens/closes, links accept keyboard focus and Enter navigation,
  touch height is at least 44px. Screenshots stay ignored under `screenshots/`.
  The first QA attempt focused before the native dialog close event restored
  focus; the script now waits for that event. No application change was needed.

Run from `astro-site/` after building. For browser verification, supply external
`PLAYWRIGHT_MODULE`, `QA_BROWSER`, and optionally `QA_ORIGIN`. No extra project
dependencies are needed. Results are in `catalog-discovery-results.json`.

Review locally: `/en/explore/sharm/` and `/en/explore/cairo/` have different page
titles/descriptions. A package's included-trip card retains its modal button and
has a separate translated discovery link underneath it. Equivalent IT/ES/PT/DE
links use their respective language routes.

These checks establish generated HTML discovery and interaction behavior; they
do not establish indexing, AI citations, or correctness of existing catalog
associations. Unrelated pre-existing working-tree changes are excluded from commit.
