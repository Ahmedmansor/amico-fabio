# Home loading follow-up — 2026-11-02

Native lazy loading fetched the two horizontal offscreen hero images on mobile
before any interaction. Their markup now lives in inert templates with native
no-JavaScript fallbacks. Pointer/keyboard/scroll interaction populates the mobile
slide slots; desktop motion populates them after the first image decodes and has
two animation-frame opportunities to paint. All three original images/copy,
responsive dimensions and mobile swipe slots remain. One HeroSlide component
owns the picture formats, sizes and image priorities. No dependency or Auth,
analytics, booking or consent behavior changed.

Focused browser checks: IT/EN at 375/1280px, first mobile image only/no motion
chunk initially, all three images decode after interaction or desktop setup,
no overflow/page errors. Separate no-JavaScript case retains all three images.
Five cases passed. Local ignored desktop/mobile screenshots were inspected.
Astro check: 584 files, 0 errors/warnings/hints; build: 171 pages complete.

Lighthouse mobile 13.6 on identical local gzip origin/settings, cold single runs:
performance 86 → 88, accessibility 100 → 100, LCP 4.0s → 3.9s, TBT 140ms → 0ms,
CLS .001 → .001. Total observed image transfer 326489 → 239785 bytes (86704 fewer).
See performance-comparison.json. Image request reduction is directly verified;
single-run timing changes are noisy and do not establish a field improvement.
The 2.5s LCP target remains open. Earlier runs on other local artifacts measured
3.5–3.6s and should not be presented as the controlled baseline for this change.
