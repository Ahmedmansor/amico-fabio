# Tour and package detail presentation — 2026-10-29

Shared `ProductDetail` and `ProductGallery` replace duplicated page scaffolds. The price and booking fields now form one viewport-bounded sticky sidebar; inclusions/exclusions are in the reading column. Sticky boundaries include the FAQ and stop before the footer. The sidebar can scroll internally when its fields exceed the viewport. Mobile/tablet use an in-flow form and a shared floating anchor, hidden while the form/footer is visible. Only its arrow animates; reduced motion disables it.

The charcoal surface derives from the approved theme and also applies to the detail-page header. Rounded photo mosaics open a native dialog with a large image, previous/next controls, keyboard arrows, thumbnails, Escape and restored opener focus. Images use Astro optimization. Hover uses a pointer without autoplay/zoom or new downloads. Packages can show photos from their actual included trips in addition to their own validated gallery.

Visual reference: https://www.memphistours.com/egypt/round-trip-nile-cruise-and-pyramids . No reference text, ratings, prices or images were copied.

## Verification

- `npx astro check`: Result (555 files), 0 errors, 0 warnings, 0 hints.
- `npm run build`: 171 pages built; Complete. Static output, existing provider.
- Chromium `review.mjs`: 12 cases (IT/EN, tour/package, 375/768/1280). Before: 12 overlapping cases. After: zero overlap, zero horizontal overflow, zero page errors. All recorded content/prices/addons preserved. Gallery controls, Escape, image load, computed header/background match, sticky positioning, mobile anchor and passenger totals passed. Included-trip popup retained.
- Local matching-width screenshots: ignored `screenshots/before/` and `screenshots/after/`; manually inspected the desktop booking and lightbox views. JSON comparison is committed. The final backdrop was subsequently darkened and visible booking labels associated with their controls; final build/Lighthouse include those changes.
- Lighthouse 13.6, local gzip static preview, same detail URL, mobile then desktop (raw reports ignored): mobile performance 90/accessibility 100, LCP 3.6s, TBT 0ms, CLS .026; desktop 100/100, LCP .7s, TBT 0ms, CLS 0. Local lab measurements vary and are not production field data. See `lighthouse-summary.json`.
- No external booking/inquiry was submitted. Booking domain/data and provider settings unchanged.

Preview: http://127.0.0.1:4333/en/tours/ras_mohammed_white_island_vip/ and http://127.0.0.1:4333/en/packages/sharm_confidential/ . Scroll the page on desktop, scroll inside the long form, open photos and use arrows/thumbnails, then try the mobile booking anchor.
