# Desktop and iPad home refinement — 2026-11-02

The owner requested premium desktop/iPad polish, explicitly authorizing this
visual change beyond migration parity. Home-only CSS uses the existing palette,
fonts, assets and content. Desktop has distinct text/photo columns and an inset
photo frame; portrait tablets have a landscape photograph above a two-column
editorial text panel. Trust dividers, destination proportions, booking numbers,
review widths, spacing and fine-pointer feedback follow the same composition.
Phone layout and the existing conditional animation modules remain in place.

21st CLI 1.18.0 login succeeded after the owner offered to sign in. Contextual
catalog search and `get 19077 --json` retrieved Editorial Image Hero:
https://21st.dev/@felipemenezes098/components/hero-07 . Its separate photo/copy
composition is the reference; this implementation is original Astro/CSS. No
React/Motion component code, dependency installation or hosted generation was
used. Cloud source review was not repeated because of the documented previous
automatic approval rejection of private-source export. Local diff review and
browser verification supply the evidence. UI UX Pro Max responsive/touch/reduced
motion guidance was read; its optional search could not run because Python is
not installed in the accessible runtime.

## Actual verification

- `npx astro check`: 596 files, 0 errors, 0 warnings, 0 hints.
- `npm run build`: 103-page default static flavor passed. Then the matching
  preview flavor passed with PUBLIC_NOINDEX=1, BLOG_INCLUDE_FIXTURES=1 and
  PUBLIC_SITE_URL=https://amico-fabio-iyzo.vercel.app: 171 pages, 70 editorial
  metadata/link checks, 50 structured-data checks, empty noindex sitemap.
  The first preview attempt correctly failed because PUBLIC_SITE_URL was absent;
  adding the required public test origin fixed it. No hosting flags were changed.
- `premium.mjs before` / `premium.mjs after`: 12 cases each, IT/EN at 375, 768,
  820, 1024, 1180 and 1440px. Tablet cases emulate touch; these are Chromium
  viewport checks, not a claim of physical iPad/Safari testing. All cases passed
  after the matching preview build. Existing hero text/CTA, biography HTML,
  benefits, booking steps, destination labels, reviews, main links and image alt
  sequence match the captured baseline. No missing/wrong content was found.
  Original image imports and video IDs are unchanged. Geometry confirms distinct
  desktop columns, stacked portrait-tablet image/copy and no horizontal overflow.
- Existing `polish.mjs`, report `premium-motion.json`: 7 cases passed, including
  real animation/tilt, full biography text, modal focus/scroll/Escape/restoration,
  mobile offscreen pause, reduced motion and conditional enhancement loading.
- Both browser probes verified square uncropped video thumbnails, working review
  arrows, no pre-play Vimeo requests and zero page errors. No leads/emails sent.
- Manually inspected desktop and tablet top, portrait and review screenshots.
  Before/after screenshots stay ignored under screenshots/premium-before and
  screenshots/premium-after. Baseline is the current approved Astro home, rather
  than the legacy layout superseded by this explicit visual request.
- `git diff --check` passed. Only this task's files are staged/committed.

Reproduce using the existing external PLAYWRIGHT_MODULE and QA_BROWSER paths,
serve `dist` with scripts/serve-static-qa.mjs on port 4341, then run
`node qa/home-refresh/premium.mjs after`. Results are premium-before.json,
premium-after.json and premium-motion.json. Test deployment evidence, if
published, is recorded separately; local output alone does not prove deployment.
