# Single final price — 2026-10-15

The clarified rule is d when nonblank, otherwise p, independently for adults
and children. Explicit zero is retained. Both adult cells blank is an error;
both child cells blank means zero. Invalid selected prices fail without fallback.
Only `adult` and `child` remain in the active domain price model. Sheets evidence
is retained by the data adapter, outside browser booking configuration.

Cards, sorting, detail headlines, breakdowns, booking totals and WhatsApp messages
consume the same final amounts. IT uses existing `A partire da`; EN uses approved
`Starts from`. Crossed-out prices, percentages, deal messages and the HOT_DEAL
price badge are removed. Top/VIP/editorial badges and recommendation scoring
are retained. Source Sheets, legacy source and campaign claims are unchanged.

`comparisons.json` contains 24 fresh browser observations (12 matched pairs):
Sharm explore, Ras Mohammed/White Island tour, and Il Grande Blu package, in
IT/EN at 1440x900 and 390x844. Matching legacy and Astro screenshots are ignored
local JPGs alongside this report. They are not included in a fresh clone.

Content text (ignoring markup whitespace), card order, captions/alt text, totals,
images and detail links were checked. No missing source content was found. The
intentional differences are the single-price markup, the removed HOT_DEAL badge,
and the English starting-price label. Offscreen lazy gallery thumbnails may
remain unloaded; every referenced generated image file is checked independently.
Minor existing spacing differences remain; no redesign was performed.

Reproduce after building:

```sh
npm test
npx astro check
npm run build
node scripts/verify-single-price.mjs
```

Actual final results:

```text
npm test: Node 76 passed, 0 failed; Vitest 96 passed (6 files)
npx astro check: Result (170 files): 0 errors, 0 warnings, 0 hints
npm run build: 90 page(s) built in 16.96s; Complete! (exit 0)
verify-single-price.mjs:
  72 bilingual detail pages and 144 rendered catalog cards:
  one adult amount, starts-from labels, correct totals/links, no discount markup.
  12 matching mobile/desktop IT/EN browser comparisons:
  content, images, order and totals retained; approved price markup changes verified.
```

The existing Browserslist age warning remains. No dependencies were added or
updated. No booking/lead was submitted, and no deployment was performed.
