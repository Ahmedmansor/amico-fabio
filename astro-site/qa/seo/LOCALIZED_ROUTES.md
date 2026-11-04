# Localized catalog URLs — 2026-11-03

Follow-up: section names are now translated too. See LOCALIZED_SECTIONS.md for
the current paths and verification (324 aliases). The checkpoint below records
the preceding slug-only implementation.

Implemented on `codex/localized-catalog-urls`; not published to production by
this task. Supabase schema, source IDs/slugs, prices, Auth, production hosting
and the live domain are unchanged.

## Routing contract

Each existing localized catalog dictionary now owns a persisted `route_slug`.
Initial values are normalized from its existing approved title: remove markup,
transliterate diacritics (and German ß to ss), lowercase, join words with hyphens.
No translations, marketing claims, prices or IDs were invented. Existing English
brand/offer names within a translated title remain as approved. Future title
edits do not automatically change a published slug. Add an explicit route_slug
with every future translated catalog record; do not generate it at runtime.

The pure shared catalog-routes domain module validates required names and
per-language, per-namespace uniqueness, including collisions with another
record's legacy alias. All providers share that validation. Original Supabase
slug/ID and guest/account wishlist identity remain intact.

Static routes, explore/wishlist/included-tour cards, editorial catalog links,
guide products, JSON-LD, language switchers, canonical/OG URLs and reciprocal
hreflang use the localized route. Example for the same `super_safari_5_senses` ID:

```text
/it/tours/super-safari-i-5-sensi-del-sinai/
/en/tours/super-safari-5-senses-of-sinai/
/es/tours/super-safari-los-5-sentidos-del-sinai/
/pt/tours/super-safari-os-5-sentidos-do-sinai/
/de/tours/super-safari-die-5-sinne-des-sinai/
```

All 180 old published tour/package URLs remain generated. GitHub Pages cannot
provide custom HTTP 301 rules: these are HTTP 200 compatibility documents with
an immediate meta refresh, noindex, canonical to the target, localized title/
description and OG image for old shares. A small inline location.replace also
preserves query parameters/fragments where JavaScript runs. No server or hosting
architecture change. Redirects are excluded from the sitemap; 230 indexable
pages remain. Do not remove aliases while old bookmarks/shares/email links exist.

The v1 public email manifest preserves localized.url as the old valid alias for
the already-deployed worker contract; additive canonical_url contains the new
route. Updated local email code validates and uses canonical_url. Existing
remote workers continue using working aliases until a separate coordinated
worker rollout. No worker was deployed, recipient scope widened or email sent.

## Actual verification

```text
npx astro check
Result (722 files): 0 errors, 0 warnings, 0 hints

npm run build
Verified canonical and reciprocal hreflang for 230 indexable pages
428 page(s) built in 17.83s; Complete!

Focused Node domain/provider tests: 18 tests, 18 pass, 0 fail
Focused Vitest route/blog/email tests: 4 files, 23 tests passed
Focused localized SEO integration tests: 3 tests, 3 pass, 0 fail

node qa/seo/verify-localized-routes.mjs
Localized catalog verified: 180 pages, 180 preserved aliases, 1900 canonical internal links;
5-language switchers/hreflang, prices, schema and backward-compatible email manifest passed.

node scripts/verify-catalog-seo.mjs
Catalog SEO verified: 180 static pages; localized text, canonical/hreflang,
one H1, JSON-LD, visible EUR prices, itineraries, included-tour targets and local share images match.

Content comparison against HEAD before this task:
10 dictionaries unchanged except 205 persisted route slugs (including inactive catalog entries).
```

Initial provider parity test exposed an outdated fixture: it exposed private
Global_Settings keys that the actual public_settings policy excludes, causing
an unrelated missing Spanish translation error. Updated only the test fixture
to mirror published promo_banner access; full focused provider parity then passed.
Initial Astro diagnostics and a test error-message expectation were corrected
before the successful final checks above. No failing check is treated as passing.

Browser smoke on the local static preview verified the original Italian Super
Safari alias redirects to the Italian translated route while preserving
`?utm_source=route-check#booking`. Opening its language menu showed all five
translated equivalents; clicking English opened the same tour at its English
URL with the English title and unchanged EUR 55 price. No booking/Auth submitted.
The first sandbox-only preview was unreachable; the browser test succeeded after
starting this task's preview with the required host network permission.

Run both verification scripts from astro-site after the intended release build.
Commit only code, JSON reports and this document; build output/caches stay ignored.
Rollback by reverting this focused source change and rebuilding; never change
catalog IDs or delete favorites. No screenshots or generated dist are committed.
