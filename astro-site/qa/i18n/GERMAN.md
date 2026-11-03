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

## Verified test deployment

Application commit `b085118` was pushed on the existing migration branch.
Vercel project `amico-fabio-test` is Ready, deployment
`dpl_EB6XtWHEAZ5sqqWJPDJF5ddrEsH8`, 40-second build, at
https://amico-fabio-test-1q1se4yi1-fabio-landing-pages.vercel.app . Inspect confirmed
the stable alias https://amico-fabio-iyzo.vercel.app . No hosting variables changed.

All 24 deployed Chromium cases passed at 390/1440px, covering the twelve German
page types, catalog interactions and prepared WhatsApp text without sending.
See `german-deployed.json`. The published manifest contains 36 catalog items,
each with IT/EN/ES/PT/DE titles and matching test-origin URLs; its environment is
`test`. See `german-hosted-catalog.json`. Only after this readback was reminder
dispatch updated to version 9; all five final Edge sources match their reviewed
payloads and their existing runtime configuration. Unsigned Auth POST: HTTP 401.

GEO Tool Check's independent readiness heuristic returned 80/100 for the sampled
German Ras Mohammed tour and 79/100 for Dolce Vita. Both returned HTTP 200 and
passed static text, localized metadata, one H1, canonical, JSON-LD and social
preview checks. Raw reports are `../seo/german-tour-geo.json` and
`../seo/german-package-geo.json`. Their indexing failure is the intentional test
`noindex`, which remains enforced. Optional suggestions about tables, question
headings, entity profiles and llms.txt are not ranking requirements or proof of
AI citations; no invented profile links, new business claims or redesign was
introduced to increase a third-party score. Google documents that ordinary SEO
fundamentals apply to AI features without special AI markup/text files:
https://developers.google.com/search/docs/appearance/ai-features .

User checklist: open `/de/`, switch languages on a tour/package, inspect your
favorites while signed in, and request a normal sign-in email only if checking
German inbox language. Real inbox and authenticated cross-browser behavior are
not claimed as agent-verified.
