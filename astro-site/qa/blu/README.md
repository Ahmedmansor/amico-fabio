# Current landing journey

See JOURNEY.md for the owner-approved redesign, visible character cards, catalog-based choices and current checks. Earlier sections below are historical revision evidence.

# Blu campaign — 2026-11-04

## Current revision: characters and complete-trip planner

The owner requested a softer Squidward, added Sandy, and asked for prominent access
to the existing complete-trip planner. Subsequent feedback and the final supplied
smiling Mr. Krabs image supersede the SVG redraw attempts. The owner clarified
that this is an appearance/expression reference, not a screenshot to paste into
the page. The final artwork is a new built-in ImageGen illustration on transparent
alpha, optimized to responsive WebP by Astro and displayed whole with
`object-fit: contain`, alongside the established Plankton/treasure SVG. The raw
screenshot copy and rejected Krabs SVG are removed. Squidward keeps a gentler
expression; Sandy has a squirrel tail, white suit and flower helmet. Their artwork
stays editable local SVG. No new dependency was introduced. The exact prompt and
final asset path are recorded in `KRABS_PROMPT.md`. The final PNG is 1199×1312,
has an alpha channel and transparent corner pixels (verified with Sharp).

There are now **six experience cards**, including Sandy, and still **three real
related trips**. The hero and related-trip sidebar show translated links to
`/{locale}/tailor-your-trip/`, describing a complete custom itinerary. The existing
planner is reused with no change to its form or submission behavior. The landing
page still has no prices or personal-data form; mobile bottle/WhatsApp behavior
is retained. Six cards form a regular two-column desktop grid and one-column phone
list. The expanded sidebar scrolls normally rather than pinning a tall block.

Revision verification uses `node qa/blu/revision.mjs` with the existing external
Playwright/Chromium variables. It serves the final build locally by default;
`QA_ORIGIN` optionally targets the dev preview. Four focused IT/EN phone/desktop
cases check six cards, three real trips, both planner links and their actual
destination, Sandy's WhatsApp draft, SVG containment, overflow, no prices/forms
and browser errors. No planner form or WhatsApp message is submitted. New local
screenshots are `screenshots/revision-*`; tracked evidence is
`revision-results.json`. Existing `browser-results.json`, baseline comparisons
and the 16-case results below describe the initial `2de71b8` checkpoint; that full
motion suite was not rerun for this visual/navigation revision. Its reusable
script now expects six cards. The focused domain suite has five passing tests.

Final revision Astro check: 759 files, zero errors/warnings/hints; static build:
575 pages and 232 canonical/reciprocal checks. Rendered 21st review is refreshed
against the final IT/EN artifacts. See local `revision-check.log` and
`revision-build.log` for actual command output.
All four revision browser cases passed against that final static artifact; the
rendered 21st review reports zero errors, warnings and suggestions.

## Initial implementation checkpoint (`2de71b8`)

New owner-approved campaign on the existing migration branch, inside the static
Astro application. Local viewing: `/it/blu/` and `/en/blu/`; `/blu/` is a static
Italian entry redirect. This report does not claim publication on the live domain.

## Final scope

- Standalone cartoon header/footer, original supplied SVG characters, Fabio's
  three poses, comparison portal, underwater palette and secret-formula bottle.
- Italian and English static HTML, matching dictionaries and reciprocal hreflang.
  No invented ES/PT/DE campaign translations. Shared SEO now validates registered
  campaign subsets while retaining the main site's five-language requirement.
- Three actual published Sharm trips, read through `getTrips()`: Ras Mohammed
  by bus, Ras Mohammed/White Island by boat, and Super Safari. Existing catalog
  photos and translated titles; only ID/title/poster reach the presentation.
- **No prices**, crossed-out amounts, discounts, Product offers, personal-data
  form, email capture or signup. Every experience CTA opens the centrally configured
  WhatsApp contact with an editable draft; opening is not a delivered message.
- Desktop related-trip sidebar; cards follow the story on tablet/mobile. Fixed
  mobile bottle links directly to WhatsApp, uses safe-area insets and reserved
  bottom space, and hides while cookie dialogs are open. Selecting an experience
  updates the main/mobile bottle draft without changing unrelated trip links.
- Shared, consent-gated `generate_lead` measures explicit handoff only. Payload:
  campaign ID, channel, category and page language; never message/personal values.

## Motion and dependencies

Node **24.21.0**, already installed outside this repository and pinned by the
existing `.nvmrc`/engines. This task did not install or change Node.

| Pinned package | Purpose | Verification |
| --- | --- | --- |
| `gsap` 3.15.0 | Optional underwater motion and once-only visible card entrances | Required Astro build/check, browser chunk and downgrade checks |
| `@fontsource-variable/fredoka` 5.3.0 | Local cartoon headings, Latin variable WOFF2 | Build emits local font asset, browser font load and screenshots |
| `@fontsource-variable/plus-jakarta-sans` 5.3.0 | Local body font, Latin variable WOFF2 | Same checks; no Google Fonts request |

Lite is the complete HTML/CSS page. GSAP/effects are imported only after preference,
save-data, available memory/CPU hints and a bounded frame sample pass. Missing
hardware APIs remain neutral, allowing Safari/iPad to use measured performance.
There is no device-name/user-agent/viewport-based quality classification. A second
bounded sample checks actual animation cost; sustained long tasks also downgrade
to Lite. No permanent FPS loop, WebGL, device sensors, audio or telemetry display.
Motion stops while the tab is hidden or cookie dialogs are open, and respects
system reduced-motion/data-saving even when Full is selected. Stored preferences
are optional; denying browser storage does not break interactions.

21st reference: [Card Spotlight](https://21st.dev/aceternity/card-spotlight/default).
Own scoped CSS variables and Vanilla pointer handling; no React, copied component
source or Framer Motion. UI UX Pro Max accessibility/performance guidance informed
44px controls, focus, keyboard interactions and motion gating. Its Python
search could not run because this host has no Python installation; no database
search result is claimed. Automatic approval rejected the initial contextual 21st
search because it could export internal project data. Public-reference research
and deterministic local CLI review proceeded without uploading source.

## Baseline and intentional differences

`landing-pages/blu.html` is an unchanged archive of the supplied HTML, SHA256
`ebf96404f24c9af874d5b8174e84b8dad3debff1941df4c5c09f257c824620a9`.
It matches the attachment byte-for-byte and is not a published route. Matching
390×844 and 1440×900 source/new screenshots for IT/EN are local/ignored. New
820×1180 screenshots also verify tablet layout. The capture substitutes local
Tailwind/font equivalents and disables the source's incomplete scripts; it is
visual/content evidence, not evidence that source interactions worked.

`content-comparison.json` enumerates every source-only/new text line and link in
those comparisons. The approved changes explain their differences:

1. The source repeats the first three character cards (eight total). The campaign
   has the five unique experiences; no unique character is missing. Existing SVGs
   remain, including the Fabio avatar, village, three poses and bottle. The drawn
   “real sea” portal background is replaced by an actual Ras Mohammed coastline
   photograph (`ras_mohammed_bus_half_day/3.webp`). Three catalog photos are added.
2. Source GPU/CPU/FPS display, engine credits, upload/sprite-sheet editor, depth
   gauge and narrator/time-card/audio demo are omitted. Simple translated motion
   controls replace the diagnostic toolbar. No “3.5 hour flight” claim is retained.
3. Copy is rewritten consistently in both languages as a playful comparison.
   Claims that the Red Sea inspired the cartoon, an official SpongeBob venue,
   absolute safety/certification, exclusive access, instant secret-map delivery,
   private-group access and unconfirmed fan benefits are removed. No replacement
   commercial promise or discount is invented. Decorative role/percentage tags
   and character-quote badges are omitted; titles and five themes remain.
4. The source's Spanish browser toggle is not published. IT/EN switching uses
   actual static routes and complete translated labels/errors instead of changing
   only some DOM text. Placeholder WhatsApp links are replaced by shared config.
5. The footer's tool credits become actual site/legal/contact links. The user's
   later no-prices/direct-chat instruction is applied to all related trip cards.
6. Card illustrations are contained inside their frames at all tested widths;
   small differences in spacing, stroke and layout follow the campaign adaptation.

## Reproduction and recorded checks

From `astro-site/`, with Node 24.21.0 active:

```text
npx astro check
npm run build
node node_modules/vitest/vitest.mjs run src/features/blu/domain/__tests__/campaign.test.ts
node --test src/shared/seo/__tests__/*.test.mjs
node qa/blu/browser.mjs
```

Browser QA uses the existing external Playwright installation through
`PLAYWRIGHT_MODULE`, and optional existing Chromium `QA_BROWSER`. It starts an
ephemeral local static server; every external request, including WhatsApp and
Analytics, is intercepted. It never sends a message. Baseline comparison images
remain ignored; JSON, scripts and this report are tracked.

Actual outputs before final commit are recorded in the chat and summarized here:

- Astro check: 757 files, **0 errors, 0 warnings, 0 hints**.
- Static build: **575 pages**, **232** canonical/reciprocal checks, live read-only
  catalog validated (22 trips, 14 packages, 3 addons, 1 settings).
- Feature/domain: **5 tests passed**.
- Shared SEO: **17 tests passed**. Two existing test fixtures assumed only IT/EN;
  their fixtures now use the actual shared language list. The main-site validator
  was not weakened to accommodate a campaign.
- Focused browser: **16 scenarios passed**, including both languages at three
  widths, keyboard portal/poses, no prices or forms/duplicate IDs, loaded images,
  fixed mobile bottle, save-data/reduced-motion/weak hints/no-JS/denied storage,
  GSAP not downloaded in Lite, strong-phone/unknown-hint enhancement, simulated
  sustained-jank downgrade, clipboard success/failure and analytics consent/data.
  Device performance cases use synthetic hints/jank, not a physical-device claim.
- Local 21st source review: zero errors/warnings; campaign-color suggestions are
  intentional palette isolation. Final rendered IT/EN review: **0 errors,
  0 warnings, 0 suggestions** (`21st-rendered-review.json`).
- Optional npm audit reported the already-existing `undici` 8.11.2 high advisory;
  its version/integrity are unchanged from HEAD. None of the three new packages
  was named in the runtime audit. No unrelated automatic audit fix was applied.

No live lead, message, account or email was submitted. Legacy source, legacy
manifest/lock/config, main, hosting settings and the production domain are untouched.

Implementation diff checks exclude only `landing-pages/blu.html`: the immutable
owner reference contains ten original trailing-whitespace lines. They are retained
to preserve the byte-for-byte baseline; all active source/report changes pass.
