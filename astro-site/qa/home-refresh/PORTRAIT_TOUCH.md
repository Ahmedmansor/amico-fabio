# Gentle mobile portrait motion — 2026-11-03

Touch previously enabled the desktop-strength pointer tilt, displaced the deep
foreground and paused/replaced the automatic CSS animation. The abrupt change
looked like a zoom. Pointer-driven motion now requires a mouse and a fine hover
pointer. Touch uses only the existing gentle CSS drift, without requesting
sensors, preventing native gestures or changing the portrait/copy/CTA.

Actual checks: Astro check 736 files, zero errors/warnings/hints; static build
572 pages completed (42.54s). WebKit and Chromium each passed mobile real tap
plus sustained touch events, continued automatic animation, reduced motion and
desktop mouse tilt: 6 cases. See portrait-touch.mjs and portrait-touch.json.
No biography/dialog behavior or deployments changed.
