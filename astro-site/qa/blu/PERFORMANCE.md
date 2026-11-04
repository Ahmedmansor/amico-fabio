Current continuous ocean motion uses native Web Animations and rasterized existing jellyfish. See COMPOSITOR.md for the latest implementation, scroll-budget tests and measurement limits.

# Blu animation performance rules — 2026-11-04

1. IntersectionObserver starts and pauses card reveals and jellyfish. The scroll
   photo enhancement exists only while that section intersects the viewport.
   The fixed ocean layer is viewport decoration with a bounded 26-bubble pool.
2. Animated properties are transforms and opacity. Removed clip-path animation,
   animated button shadows and pointer-following gradient repaint. Selected
   borders/shadows change once on interaction, without an animated interpolation.
3. Scroll/resize and portal pointer movement coalesce into one pending
   requestAnimationFrame. All scheduled frames are cancelled during cleanup.
4. Existing visibilitychange handling destroys effects on hidden tabs and
   recreates them only after the visible-tab frame sample. Consent/preferences
   overlays also pause the effects.
5. All below-fold photographic content uses lazy Astro images with dimensions.
   The hero portal remains eager. No video/3D player was added.
6. The GSAP effects remain a dynamic import behind motion and hardware gates.
   A separate reveal module imports only when its section becomes visible.
   Async initialization checks disposal and generation to prevent stale restarts.
7. Scroll, resize and mouse movement are frame-coalesced, with passive listeners.
   Offscreen reveal listeners are removed entirely.
8. The catalog is four programs and six character cards. Static content remains
   in HTML for access/search and no carousel clones or growing particle lists
   are generated. The 26 bubbles are removed when leaving Full.
9. will-change applies only to the active scroll photo and is removed on exit.
   Cleanup clears only properties owned by the effect, rather than clearProps:all.
10. OS reduced motion and save-data take precedence. Reduced skips the GSAP
    effects import and keeps content and controls available.
11. Optional content-visibility is deferred to preserve predictable section
    measurements and native anchor/focus behavior on this small fixed catalog.

Tests cover actual bubble displacement, mode cleanup, the native reduced-motion
media query, offscreen photo cleanup, bounded DOM counts and a synthetic
hidden-tab event. These checks establish lifecycle behavior. They are not
physical device battery measurements or a guarantee of 60 fps.

The upward-bubble browser assertion now samples a bubble in the middle of the
viewport. The old fixed bubble index could wrap to the bottom during the sample,
which caused a false failure at the normal end of its animation cycle.
