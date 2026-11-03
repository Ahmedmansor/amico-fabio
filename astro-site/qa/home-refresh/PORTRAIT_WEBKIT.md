# Visible mobile portrait motion in WebKit — 2026-11-03

The owner reported that the portrait still looked static in the iPhone WebKit
window. Earlier tests checked that the scene animation clock advanced, which
did not establish perceptible image motion. A visible Playwright 1.64.1 / WebKit
27.2 iPhone 14 run confirmed a running scene transform with nearly identical
visible framing at sampled opposing rotation phases. Reduced motion was false.
The old local port 4346 was unavailable during this follow-up, so an isolated
static preview serves the exact current build at http://127.0.0.1:4348/ .

Mobile CSS now animates the foreground and background directly in opposite
directions, with constant scale/depth and gentle 7-second easing. It no longer
depends on rotating their nested preserve-3d parent to make motion visible.
Desktop pointer tilt is unchanged. Touch still cannot enable the strong mouse
motion; reduced motion, visibility and open-dialog pause gates remain.

Actual checks, Node v24.21.0:

```text
npx astro check
Result (737 files): 0 errors, 0 warnings, 0 hints
npm run build
572 page(s) built in 31.25s; Complete!
node qa/home-refresh/portrait-render.mjs (Playwright 1.64.1)
WebKit 27.2 iPhone 14 headless: changedPixelFraction 0.3312,
horizontalTravel 14px, constantSize, noTouchZoom, reducedMotion: PASS
WebKit 27.2 iPhone 14 visible window: same measurements: PASS
node qa/home-refresh/portrait-touch.mjs
WebKit: mobile/reduced/desktop PASS
Chromium: mobile/reduced/desktop PASS
```

The new render test compares actual screenshot pixels at the animation's two
extremes and asserts foreground displacement plus constant width/height. This
would not be satisfied by a running clock alone. 33.12% of portrait-region pixels
changed by more than 20 RGB levels; actual image movement was 14 CSS pixels,
without scaling. It also tests touch safety and reduced-motion behavior.
Screenshots stay local/ignored in screenshots/portrait-render/; JSON and scripts
are committed. External requests were blocked. This verifies both visible and
headless WebKit emulation, not a physical iPhone. No production deployment.
