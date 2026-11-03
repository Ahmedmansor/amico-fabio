# Thumbnails, Fabio and motion — 2026-11-02

Six existing Vimeo thumbnail frames are now 1:1 with object-fit contain, preserving
the whole original thumbnail. Player aspect/consent/video IDs are unchanged.
Biography is a separate Astro component: native modal, labeled title, fixed close
header, independent reading scroll, original portrait, readable line length and
spacing, visible keyboard focus, explicit focus wrap, Escape/backdrop/close and
opener focus restoration. Original IT/EN biography HTML/text is unchanged.

The user explicitly superseded the previous static mobile portrait preference.
Mobile now has a mild CSS 3D drift only while visible, and passive touch tilt.
No device sensor permission, continuous JavaScript frame loop or motion library.
Offscreen, hidden-tab, dialog-open and reduced-motion states stop the relevant
animation. Desktop mouse tilt shares the small poster module; its large-screen
hero/review rotators remain in their existing conditional chunk.

Shared once-only card reveals load a separate native-API module only at >=768px
and without reduced motion. Selected home, explore, wishlist, article cards and
product facts opt in explicitly. No hero/LCP target is revealed, no CSS pre-hides
content and no behavior/data/price changes. Hover polish is fine-pointer only.

Applied UI UX Pro Max focus visibility/long content guidance and installed 21st
ui-build workflow. Public MIT-listed references: Scroll Reveal by Cnippet
(https://docs.21st.dev/@cnippet-dev/components/scroll-reveal-2), Origin UI Dialog
(https://preview.21st.dev/@originui/components/dialog). Own Astro/Vanilla adaptation;
no React/Radix/Motion dependency or source copy. CLI 1.18.0 search returned Not
signed in. No authenticated component retrieval or cloud review is claimed;
the previous cloud source-export rejection was respected.

Verification: Astro check 595 files, 0 errors/warnings/hints; static build 171
pages complete. Seven Chromium cases: IT/EN at 375/768/1280 plus cold reduced
motion. Entire biography text, reading-scroll header position, focus cycling and
restoration, mobile animation timeline/touch, desktop pointer tilt/reveal calls,
no desktop chunk on mobile/reduced motion, full square thumbnails, no overflow/
page errors, offscreen pause and no Vimeo requests before play passed. Desktop/
mobile screenshots were manually inspected and remain local/ignored. The first
keyboard check exposed native focus leaving to browser chrome; explicit wrapping
was added. Other probe refinements wait for entrance animation/compositor state
and stable hover coordinates, not arbitrary initial frames. No external leads,
accounts or emails were sent. See polish.json.

Deployed source `54594ab382921b9547c98558c7569a358eff21d8` is Ready at the existing
test alias (deployment `amico-fabio-test-bncr4aot4-fabio-landing-pages.vercel.app`).
The same seven cases passed on the real test host; see polish-deployed.json.
Mobile Lighthouse 13.6: performance 99/accessibility 100, LCP 2.2s, TBT 0ms,
CLS .001, no failing accessibility audits. One cold lab run, not field INP or a
controlled causal improvement claim over prior runs. No hosting flag or content
publication setting changed; approved dummy blog content remains enabled/noindex.
