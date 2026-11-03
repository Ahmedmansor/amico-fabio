# Sharm Secrets migration

Routes: `/it/sharm-secrets/` and `/en/sharm-secrets/`. The legacy
`sharm-secrets/index.html` remains unchanged. Home, header and footer now link
to the migrated guide in the current language.

The six sections retain all original content: introduction and Fabio photo,
three services and their callouts, ten commandments and their callouts, four
packing items, Farsha text/photo, and eight adventure photos/captions plus logo.
No prices, policies, copy, translations or image identities were changed.

## Comparison

The eight `legacy/astro` × `it/en` × `desktop/mobile` full-page screenshots
were captured at matching 1440 × 900 and 390 × 844 viewports. `comparisons.json`
records all six sections' text and image alt identities from the browser DOM.
No missing or incorrect sections, visible texts, images or content links were
found. Paragraph boundary whitespace differs in the serialized DOM; visible
paragraphs remain separate. Optimized image encodings differ from originals.
The rotating gallery can display a different slide at capture time.

Some offscreen gallery thumbnails remain lazy-loaded in the initial captures;
`gallery.json` verifies every full-sized image opened and loaded with its exact
caption. The first Italian desktop capture was refreshed after verifying all
ten commandment images loaded. Additional matching commandment screenshots and
an English mobile modal screenshot document these views.

The index was opened/closed on desktop and mobile, and links to sections three
and six were exercised. Section six settles at the original 80px header offset.
All eight gallery buttons open the correct photo/caption and the close button
closes the overlay. Language switching navigates to the corresponding guide.
Shared WhatsApp and footer links retain the configured legacy destinations.

## Existing source limitations preserved

- The Italian private-car callout ends at `vuoi anda` in the source dictionary.
  Its English copy is the existing complete English text. No replacement was
  invented.
- SEO title/description exist only in Italian in the legacy HTML; the same
  source strings are retained in both dictionaries pending approved copy.
- Farsha's legacy alt label remains Italian in both languages.
- Packing icon classes refer to Font Awesome, which the legacy guide does not
  load. The existing gold circles are preserved; no library/icons were invented.

## Implementation and verification

Feature data owns dictionary/physical-image validation, domain owns pure
content/index/gallery validation, and presentation owns Astro markup and small
index/gallery/scroll scripts. Missing required text, images or translation/image
identity mismatches fail generation with the affected field. Six background
images receive explicit optimized URLs, avoiding legacy relative CSS fallbacks.
The legacy unguarded Service Worker/cache reset is not copied to the feature.
Original local assets are copied byte-for-byte and optimized by Astro at build.
No dependency was added; domain tests use the existing Node test runner.

From `astro-site/`:

```sh
npm test
npx astro check
npm run build
node scripts/verify-secrets-migration.mjs
node scripts/verify-home-migration.mjs
node scripts/verify-legal-migration.mjs
node scripts/verify-explore-migration.mjs
```

Open both routes at mobile and desktop widths, use the Index button to inspect
all six sections and open each adventure photo. Booking/detail compatibility,
offer and welcome pages are separate later tasks.
