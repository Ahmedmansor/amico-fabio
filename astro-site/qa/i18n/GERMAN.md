# German site — 2026-11-03

The user explicitly selected the whole main site, including tours and packages,
and separately approved the Supabase language update after automatic review
initially rejected it. German (`de`, `de-DE`, LTR) joins IT/EN/ES/PT in the shared
configuration. No new dependency, framework, server or paid service was added.

Translated all 27 existing tour records and 14 packages, including full programs,
inclusions/exclusions, notes and SEO tags; 22 tours and all 14 packages are
currently published by the live catalog. Prices, IDs, slugs, source fields,
clock times and source business claims are preserved. German copy does not
promise German-speaking guides: existing Italian/English service labels remain
accurately translated. Shared booking, WhatsApp, currency, navigation, consent,
Auth, wishlist and legal copy is translated, along with home and Sharm Secrets.

Nine existing destination guides and six displayed demo journal stories have
German equivalents reusing original images. EN/demo articles gain only a
translationKey to connect their actual German equivalents. Original dates and
fixture/demo/draft markers remain unchanged; this does not turn preview content
into approved production editorial content. IT-only campaigns remain IT-only.
Internal test-fixture articles are not customer articles and were not translated.

The German mobile Sharm heading exposed an existing intrinsic-width issue. The
hero children can now shrink and headings wrap long words, following the
ui-ux-pro-max long-token guidance. No clipping, redesign or font-size workaround.
Local ignored screenshots cover all twelve tested page types at 390/1440px.

Actual checks:

- `node scripts/i18n/check-translations.mjs`: 45 dictionaries passed identical
  keys, array lengths/types, placeholders, HTML, stable IDs/assets and numbers.
- Focused Node tests: 44 passed, 0 failed; includes German signed Auth callback,
  localized OTP/link text, replay and ownership behavior using synthetic data.
- Focused Vitest: 69 passed across booking totals, email catalog/templates and
  account locale. Obsolete unsupported-locale examples were changed to `fr`.
- Astro check: 714 files, 0 errors, 0 warnings, 0 hints.
- Static noindex/demo build: 358 pages in 29.54s; 355 canonical/reciprocal language
  checks, 113 editorial metadata/link checks and 83 JSON-LD contracts passed.
  The test sitemap contains no indexable URLs.
- `node scripts/verify-catalog-seo.mjs`: 180 generated catalog pages passed actual
  localized text, one H1, canonical/hreflang, visible EUR price, itinerary,
  included-tour and local image assertions. See `../seo/catalog-results.json`.
- `qa/i18n/site.mjs`, `QA_LOCALES=de`, `QA_FULL_SITE=1`: 24 local Chromium cases
  passed, including same-content language links, filters, included-trip details,
  invoice and German WhatsApp preparation. No WhatsApp message was sent.

Earlier failures were real and corrected: the first noindex build omitted its
required asset origin; the first browser run used a server in a different local
network context; mobile Sharm text overflow was fixed. An Astro pass started
before test-fixture edits reported two stale diagnostics; its later completed
run passed. No failed check is represented as successful.

Supabase schema support is applied with matching original ACLs; native DE/PT
role/consent/stale-write/withdrawal tests passed and rolled back completely.
Baseline and final counts: 7 Auth users, 6 profiles, 4 reminder preferences,
0 marketing preferences, 1 reminder job, 0 remaining disposable test accounts.
All five exact Edge payloads passed Deno check; runtime configuration is retained
byte-for-byte from downloaded active sources. Dispatch activation is coordinated
with publishing the five-language email catalog, since its validator requires
all supported languages. See `../../supabase/german-language/VERIFICATION.md`.

Final authenticated browser use and real German inbox delivery are user checks;
no real email was sent by the agent. SEO improvements do not guarantee indexing,
ranking, rich results or AI citations. Main/production/domain stay unchanged.
