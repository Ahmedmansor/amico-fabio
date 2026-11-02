# Catalog presentation refinement — 2026-11-02

The owner requested extending the home polish to explore, tours and packages,
with no content changes, specifically replacing the blue included-trip preview.
The current approved Astro build is the before baseline; this is an explicitly
requested visual revision rather than migration parity with the legacy design.

## 1. Included-trip preview

Replaced the custom blue overlay with a light native dialog: fixed close toolbar,
independent reading scroll, desktop photo/summary columns, legible itinerary,
inclusion/exclusion panels and stacked phone layout. Original image associations,
trip badges, title, duration, description, highlights, full description, all
program text, includes/excludes and important notes remain. Thumbnail controls
now have translated photo labels and pressed state, using existing dictionary
keys. Native modality plus explicit Tab wrapping, Escape/backdrop/close and
opener restoration preserve keyboard access. No booking/domain/data changes.

21st CLI contextual search `light product detail dialog gallery` succeeded.
Unsplash Gallery Dialog (28467) supplied a gallery/dialog reference; the existing
native biography dialog supplies a project primitive. Own Astro/CSS/Vanilla JS;
no source copy, React, hosted generation or dependencies. The earlier documented
cloud source-export rejection is respected; no cloud review upload was repeated.
UI UX Pro Max guidance supplies touch target, focus, layout and reading checks.

Actual checks: Astro check 597 files, 0 errors/warnings/hints. Matching noindex
preview build: 171 static pages, 70 editorial metadata/link checks, 50 JSON-LD
checks. `catalog-premium.mjs before all`: 24 cases. `after modal`: 8 cases,
IT/EN at 375/820/1180/1440px, each opening all four family-package trips (32
modal openings plus reopen tests). Content fields, prices, complete booking
configuration, links, card labels and template photo counts match the baseline.
Photo selection, pressed state, sticky close toolbar, scroll reset, focus loop,
Escape/close/opener, total updates and main gallery navigation passed. No page
errors or horizontal overflow. Desktop/phone screenshots manually inspected;
screenshots remain ignored/local under screenshots/catalog-*. This is Chromium
touch/viewport emulation, not a physical iPad/Safari claim. No external submission.

Reproduce with external PLAYWRIGHT_MODULE/QA_BROWSER, static dist on port 4341:
`node qa/details/catalog-premium.mjs after modal`. JSON evidence is alongside
the script. QA_ORIGIN and QA_REPORT select a deployed host and separate report.
