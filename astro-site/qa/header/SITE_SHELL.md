# Shared shell — 2026-10-29

Implemented one Header/Footer for BaseLayout and EditorialLayout, with the
existing Fabio artwork, native disclosure navigation, Italian/English SVG flags,
explicit editorial translation URLs and unchanged feature-owned Auth/wishlist
controls. Footer retains the original biography, contact/social links and heritage;
adds main-site navigation. Campaign shells remain independent.

Removed duplicate blog chrome, old header/footer CSS and the obsolete navigation
stylesheet. Shared shell uses only theme variables. Remaining legacy content
colors are a separate next task, not claimed removed by this shell commit.

Real verification:

- `npx astro check`: Result (547 files), 0 errors / 0 warnings / 0 hints.
- Static build with the existing public Turnstile alias supplied to the process:
  103 pages built, Complete. Initial unadapted build exposed the existing alias
  gate; no Auth settings or env files were changed to bypass it.
- Noindex fixture build, local asset origin: 171 pages built in 13.15s, Complete.
- Playwright visual/content review: 18 route/viewport cases, IT/EN home, blog
  listing and Albatros tour at 375/768/1280. All HTTP 200; no page errors or
  horizontal overflow; all compared content and non-shell links preserved.
  See site-shell-before.json / site-shell-after.json and reproducible capture
  script. Screenshots are local/ignored under screenshots/site-shell-{before,after}.
- Original local static-build Lighthouse 13.6.0 mobile: Performance 71,
  Accessibility 95, LCP 7.6s, CLS 0.04, TBT 0ms. This is a single laboratory
  baseline, not field performance. Final palette/cards measurement follows.

The first post-change dev capture was discarded: concurrent Astro build/check
invalidated the dev image cache. A production-only blog capture also correctly
reported fixture content differences; the final same-content noindex fixture
comparison above resolves that environment mismatch. Neither was called a pass.

No live login, lead, email or remote-write test was performed. Nothing deployed.
