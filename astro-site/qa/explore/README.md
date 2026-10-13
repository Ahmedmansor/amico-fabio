# Explore migration — October 14, 2026

Only the explore/catalog task was migrated. Google Sheets remains the live
build-time source through `getTrips()` and `getPackages()`. The browser filters
pre-rendered HTML; it does not fetch pricing or use an old data cache.

Static routes for both `it` and `en`:

- `/explore/` — all 36 published records.
- `/explore/sharm/` — 27 records.
- `/explore/cairo/` — 6 records.
- `/explore/luxor_and_aswan/` — 3 records.

Counts are the live-source result at this migration, not hard-coded limits.
The original location IDs are retained. Legacy-style `?loc=` queries still
work; known values reach their static route, unknown values show the original
translated empty-state message. Default language remains Italian.

## Preserved content and business behavior

All published titles/descriptions, poster files, trip/package identifiers,
prices, crossed-out prices, discount percentages, badges, category labels,
sort labels, premium labels and detail destinations are from existing sources.
No copy, prices, translations, IDs or images were invented. The original CSS
cascade and manual gold/font utilities are retained. Astro optimizes posters.

The domain tests execute the actual legacy functions to compare every location,
category and sort order, as well as card prices/discounts/badges. Equal-price
ties retain source order. Recommended order keeps the old Italian/English
badge scoring. Nine items per page and sorting without a page reset are kept;
category changes reset the page. Existing booking defaults are untouched.

The card display intentionally treats a zero discount differently from booking:
the catalog shows the base price unless the discount is greater than zero.
Booking's existing zero discount behavior remains in its existing domain model.
No total-price or WhatsApp message code was migrated in this task.

Filters, sorting and pagination have pure domain functions/tests. Browser code
is scoped to explore and only controls existing cards and optional preferences.
Fresh visits reset filters; returning from details restores stored state;
language links keep location/category/sort/page via query parameters. Storage
is optional, with no storage or data access in domain code.

## Browser comparison results

`screenshots/` contains 32 full-page captures: legacy and Astro for four location
views, two languages, and matching desktop 1440 × 900 / mobile 390 × 844 widths.
Lazy images were loaded before capture. `comparisons.json` records actual browser
card text, prices, badges, target IDs, loaded images and filter/sort labels.

- Missing sections, text, images, prices, badges or detail links: none found.
- All 16 page comparisons match original card content and prices.
- All 30 English category/sort combinations tested across desktop/mobile match.
- All three Sharm pages on desktop/mobile match (27 unique records).
- Language switching kept page 3 and its location/filter/order.
- Known uppercase `?loc=CAIRO` reaches Cairo; an unknown location shows zero
  cards and the original English empty-state text. No console errors observed.
- Small spacing/scrollbar and image-encoding differences are acceptable; no UI
  redesign or business change was made. Pagination whitespace in serialized
  HTML differs, while visible pagination behavior is the same.

## Scope limits

Home destination links now point to their migrated language-specific explorer.
Detail links still reach the existing production `details.html` or
`package-details.html` with the same ID. Independent detail pages and old-URL
redirect maps are separate tasks. No booking request or message was sent.

The legacy hidden heading (`explore.title` is missing from both dictionaries),
SEO title/description and literal `Page ... of ...` pagination text are retained
exactly as the old HTML/renderer provides them, including Italian SEO/heading
on the English page. No English SEO copy was invented. These source limitations
need an explicitly approved translation later.

Without JavaScript, the location route contains its original complete catalog
and a noscript rule exposes all its cards. Client controls require JavaScript.
This fallback is verified in generated HTML; JavaScript disabling was not
available through the browser controls used in this session.

## Reproduce

From `astro-site/`:

```sh
npm test
npx astro check
npm run build
node scripts/verify-explore-migration.mjs
node scripts/verify-home-migration.mjs
node scripts/verify-legal-migration.mjs
```

Open either locale's `/explore/sharm/`, try each category, both price orders,
next/previous pages and language switching. Home's destination links should
open the same locale's explore route. No library was added or updated.
