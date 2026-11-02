# Mobile motion — 2026-11-02

The owner explicitly superseded manual-only mobile sliders/desktop-only reveals.
Hero images now advance every 5 seconds, Facebook reviews every 6 seconds and
mobile video cards every 7 seconds, using native scrolling. Desktop hero keeps
its existing fade; desktop video cards remain a grid. Existing selected cards on
home, explore, detail facts, wishlist and editorial pages get short once-only
opacity/transform entrances on mobile too (320ms, 10px, modest stagger).

Small shared native scheduler: one timeout only while the individual track is
visible/eligible, no persistent frame loop, polling or new dependencies. Touch,
mouse hover on suitable devices, focus, dialogs/consent and tab visibility gate
autoplay; explicit translated pause/resume controls are available for every
moving list. Mobile swipe resumes after release and a full idle interval;
manual Facebook arrows explicitly pause. Reduced motion stays manual and cold
reduced-motion pages fetch neither motion chunk. Changing the preference live
cleans up timers/observers/animations. Existing small poster animation remains.

Hero neighbours stay deferred until interaction/first advance; next image decode
precedes movement. Content/order, prices, images, booking and consent are
unchanged. Video cards scroll; actual Vimeo playback still requires consent and
explicit play, with no pre-play Vimeo request. No external submission/email.

21st contextual search `carousel autoplay pause touch` succeeded (Autoplay Image
Carousel, 27694, https://21st.dev/@bundui/components/carousel4). Own Astro/native
API implementation, no component source copy, React/Embla/Motion or dependency.
Existing 21st build and UI UX Pro Max interaction/reduced-motion guidance apply.
The previous cloud source-export rejection is respected; no review upload.

## Actual local checks

- Final `npx astro check`: 601 files, 0 errors/warnings/hints. Static noindex/demo
  build: 171 pages, 70 editorial metadata checks and 50 JSON-LD checks.
- `mobile-motion.mjs`: 7 cases passed. Real-time hero/review/video movement in
  EN 375px and IT 430px, desktop 1280px hero/reviews, sequential hero/wrap and
  explicit pause/resume, offscreen/touch/dialog stops and idle resume, live and
  cold reduced motion, mobile reveal calls on explore/tour/package. First mobile
  case used 4x CPU throttling. No page errors/overflow or pre-play Vimeo requests.
- First probe caught a stale consent-transition pause. Consent root classes are
  now authoritative for that overlay; its fading hidden DOM is excluded from
  the separate generic-dialog scan. Rebuilt and real-time tests passed.
- `motion-main-thread.mjs`: isolated 4x CPU profile of actual hero/reviews/videos.
  One 95ms task during initial load, zero >50ms tasks in all three subsequent
  movement phases. Earlier concurrent full test recorded startup/interaction
  long tasks, including 316ms, without attribution; the isolated profile records
  actual start times and phases instead of attributing them to animation.
- Existing home content/geometry probe: 12 cases passed against its original
  baseline. Updated biography/poster/thumbnails probe: 7 cases passed. Historical
  mobile-no-chunk/no-reveal expectations in polish.mjs and hero-loading.mjs were
  updated for the owner's newly authorized behavior; reduced-motion exclusions
  remain. Original text, links, photos and real reviews are preserved.
- Local Lighthouse 13.6 mobile: performance 90, accessibility 100, LCP 3.636s,
  TBT 0ms, CLS .000737, no failed accessibility audits. This was the uncompressed
  local QA server during another browser run, not a controlled comparison to the
  previous compressed deployed-host score. Deployed measurement is separate.
- Motion chunk 3,927 bytes and reveal chunk 800 bytes minified before transfer
  compression; no animation framework. Screenshots stay local/ignored.

These are Chromium emulation/lab results, not a guarantee for every physical
phone/Safari or field INP. Evidence JSON and reproducible scripts live alongside
this report. Set PLAYWRIGHT_MODULE/QA_BROWSER and optional QA_ORIGIN/QA_REPORT;
run `mobile-motion.mjs` or `motion-main-thread.mjs` against static preview :4341.
Local checks do not prove remote publication; deployment evidence follows.
