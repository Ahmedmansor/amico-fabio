# Blu compositor motion revision — 2026-11-04

The owner reported scroll lag on their laptop. Lifecycle checks alone did not
establish scroll smoothness. This revision keeps all three jellyfish, all 26
bubbles, surface light, flowers, portal tilt and GSAP card entrances.

- Rasterized the existing SVG jellyfish drawings into lossless transparent
  280×350 WebP assets, 69,970 bytes total. Source is the previous committed
  UnderwaterDecor artwork, not generated or substituted artwork.
- Replaced continuous GSAP updates for ocean decoration with native Web
  Animations transform keyframes. Each bubble has one animation containing
  both rise and sway, replacing two JS-driven tweens. Each jellyfish animates
  as one raster layer instead of moving SVG bell/tentacle subtrees.
- Native animations pause for offscreen jellyfish/flowers and are cancelled
  on mode changes, consent overlays, hidden tabs and page teardown.
- Retained the bounded pool and existing hardware hints, frame samples,
  reduced-motion/save-data gates and long-task downgrade.
- Added one 60-frame sample during the first actual scroll after enhancement
  initialization. This can detect rendering pressure missed by the earlier
  still-page samples and downgrade to Reduced. It is cancelled on teardown.

Verification
- Node 24.21.0; 11 domain tests passed.
- Astro check: 771 files, zero errors, warnings and hints.
- Static build: 575 pages; 232 canonical/reciprocal checks.
- ocean.mjs checks IT/EN at 390/1440px, actual upward movement, all poses,
  mode counts and OS-reduced-motion cleanup.
- scroll-budget.mjs verifies fresh-visitor Auto, native animations, a synthetic
  slow-scroll sample, Reduced downgrade and cancellation of native ocean motion.
- Browser screenshot confirms the original jellyfish appearance with alpha.
- Existing stale Browserslist notice persists.

scroll-before.json and scroll-after.json record four-second automated headless
Edge scroll samples, advancing 9px per animation frame. Samples use the same
protocol but travel distances depend on frame rate. Host load varied, including
the Lite control. They do not establish a reliable percentage improvement,
physical laptop smoothness, battery use or compositor/GPU execution on every
browser. The owner should retry the reported scroll on their actual laptop.
The preview is local at http://127.0.0.1:4387/en/blu/.
