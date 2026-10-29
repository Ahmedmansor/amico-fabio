# Shared inquiry widget — 2026-10-29

`InquiryWidget.astro` composes the existing inquiry form for every place guide and article. It reuses the same validation, in-memory draft synchronization, review/edit flow and explicit WhatsApp handoff. No provider, business rule, remote setting or dependency changed.

Place guides render the widget after the suggested experiences in the right column. An actual supported destination ID from the place/ancestors supplies the initial destination; country guides keep the existing undecided state. Related-place cards remain in the reading column so the sticky form can follow that content too. Sticky panels stop at their containing content before the footer and scroll internally when taller than the available viewport.

Articles use the same wrapper and the shared sticky helper. Mobile forms are now visible in normal flow, reached by the same floating CTA as product pages. It hides when the form/footer is visible, uses only a small CSS arrow movement and respects reduced motion. Existing inline inquiry links focus the inline form on mobile as well; pages without it retain the native dialog fallback. Removed the superseded floating-bar CSS and dialog handling.

The widget uses approved theme tokens, 24px corners, a small line icon, 48px fields and a consistent heading. The mobile Lighthouse review found an oversized place hero response; its responsive widths/sizes and encoding quality were adjusted, along with related-place thumbnails. Original image assets and copy remain unchanged.

## Actual verification

- `npx astro check`: Result (557 files), 0 errors, 0 warnings, 0 hints.
- `npm run build`: 171 pages built; Complete. Static catalog/provider architecture preserved.
- Chromium: 12 cases, zero failures — Aswan, country guide and one existing article per language, IT/EN, 375/1280 widths. One inline widget per page; after suggested products; destination correct; sticky viewport bounds on desktop; mobile anchor and reduced motion; validation, review, edit and synchronized dialog draft; no horizontal overflow or page errors. No WhatsApp handoff clicked and no external inquiry sent.
- Generated coverage: all 18 place routes contain exactly one inline widget. See `place-coverage.json`.
- Local screenshots ignored under `screenshots/`; desktop/mobile Aswan views manually inspected. The later hero-only size adjustment does not change form behavior.
- Lighthouse mobile measurements and timing are recorded in `lighthouse-before.json` and `lighthouse-summary.json`. The image adjustment changed performance 86 → 90 and LCP 4.2s → 3.6s; accessibility remains 100, TBT 0ms and CLS 0. These are local lab results, not production field data. LCP remains above the 2.5s plan target; existing body-image delivery/render dependencies remain a separate optimization opportunity. No claim of production LCP or INP verification.

Preview: http://127.0.0.1:4333/en/egypt/aswan/ . Scroll past the suggested experience, then continue reading and scroll the long form internally. On mobile tap the floating inquiry button, review and edit the draft; sending to WhatsApp is a separate explicit action.
