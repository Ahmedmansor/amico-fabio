# Catalog SEO and AI-search readiness — 2026-11-03

Tour and package routes now publish build-time JSON-LD: WebPage, TouristTrip,
Offer, ordered itinerary and BreadcrumbList. Packages link their actual included
tours with same-language canonical URLs. Names/descriptions are plain localized
text; the offer uses the same final adult EUR amount as the visible starting
price. Existing content, booking rules, stable IDs, images and design are intact.
No ratings, availability, fixed departure dates or unverified service languages
are invented. Native static HTML already contains duration, inclusions,
exclusions, itinerary and important notes, without requiring JavaScript.

Titles now lead with the localized experience name and end with Fabio Egypt.
Descriptions strip presentation markup and decode common character references.
Canonical URLs and reciprocal hreflang remain validated by the build. Script
serialization escapes `<` so source text cannot terminate an inline script.

Actual local results:

- `node --test src/shared/domain/__tests__/catalog-seo.test.mjs`: 4 passed, 0 failed.
- Initial sandboxed Astro check timed out reading the public catalog; rerunning
  with network access succeeded: `Result (638 files): 0 errors, 0 warnings,
  0 hints`.
- `npm run build`: live Supabase validation reported 22 trips, 14 packages,
  3 add-ons and 1 settings row; `199 page(s) built in 20.52s`; 184 indexable
  canonical/reciprocal-hreflang pages verified. This is the current local build
  configuration, not evidence of deployment or production indexing. An existing
  Browserslist database-age advisory was emitted.
- `node scripts/verify-catalog-seo.mjs`: 144 static catalog pages passed localized
  source/visible heading/description checks, actual EUR price matching, complete
  itinerary matching, canonical/hreflang, included-tour targets and image checks.
  Full per-route evidence is in `catalog-results.json`.

No browser interaction or appearance was changed; no new visual comparison is
claimed. Existing unrelated shell/poster edits were excluded from this task's
commit. No hosting, production/domain, provider settings or remote data changed.
German publication is a separate remaining task; this report covers IT/EN/ES/PT.

This improves machine-readable interpretation, not guaranteed indexing, ranking,
rich results or citations in AI answers. Google documents that ordinary SEO
fundamentals also apply to AI features, with no special AI schema or text file:
https://developers.google.com/search/docs/appearance/ai-features
Structured data must represent visible content:
https://developers.google.com/search/docs/appearance/structured-data/sd-policies
The catalog entity follows https://schema.org/TouristTrip.
