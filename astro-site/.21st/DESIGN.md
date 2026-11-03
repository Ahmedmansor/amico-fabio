# Fabio Egypt design context

Latest guide direction, 2026-11-02: clean light Sharm Secrets guide, no decorative
background photographs. Preserve real content photos/words; use existing local
Montserrat/Playfair. Replace decorative emoji with consistent inline SVG and cap
card photos at 360px; avoid stretched empty neighbouring cards. Index uses a
matching WhatsApp-style pill and native readable dialog/active-section marker.
21st TOC reference and supplied UI UX Pro Max guidance; minimal focused checks.
See qa/home-refresh/GUIDE_CLEAN.md.

Latest portrait/contact direction, 2026-11-02: stronger layered hover/touch depth,
with mobile copy/biography button in a separate row above a clipped portrait.
WhatsApp uses one white/orange pill and the existing contact label/link, with a
brief periodic icon-only shake across widths. Respect reduced motion and pause
when hidden, in dialogs/consent or at the footer. See
qa/home-refresh/PORTRAIT_CONTACT.md.

Latest mobile motion direction, 2026-11-02: user explicitly supersedes manual-only
mobile carousels and desktop-only reveals. Enable visible-only hero (5s), Facebook
reviews (6s), video-card list (7s, mobile only) and short once-only card entrances
across main-site widths. Native scroll/WAAPI, explicit pause/resume, touch/focus/
overlay/hidden-tab and reduced-motion gates. Defer neighbour hero images until
interaction or first advance; preserve video consent. This replaces older mobile
chunk restrictions below. See qa/home-refresh/MOBILE_MOTION.md.

Latest catalog direction, 2026-11-02: user approved extending the premium home
treatment to explore, tours and packages without content changes, specifically
replacing the blue included-trip overlay. Detail pages/header and galleries now
use light editorial surfaces; included-trip previews use a light native dialog
with fixed toolbar, responsive photo/copy columns and complete original details.
This supersedes older dark detail-page guidance below. Browse pages retain all
records/ordering with responsive filter toolbar and two tablet columns. 21st
contextual search supplied public gallery/product/travel-card references; own
Astro/CSS/Vanilla implementation. See qa/details/CATALOG_PREMIUM.md.

Latest home direction, 2026-11-02: premium desktop/iPad refinement. 21st login,
contextual search and public component retrieval (Editorial Image Hero, 19077)
succeeded in this session. Use its separate image/copy editorial composition
with original Astro/CSS: framed desktop split, landscape image above tablet copy,
aligned card rhythm and restrained shadows. Phone layout and existing motion
remain. No third-party source copied or new runtime dependency. See
qa/home-refresh/PREMIUM.md for verification. Historical catalog-access limitations
below describe earlier sessions; the previous cloud source-upload rejection
still applies.

Latest user direction, 2026-11-02: mobile Fabio portrait now moves in 3D. Use a
small visible-only CSS drift plus passive touch tilt; pause outside the viewport,
hidden tabs and open dialogs, and disable for reduced motion. This supersedes
the earlier static mobile portrait. Desktop/iPad use the MIT-listed public
[Scroll Reveal](https://docs.21st.dev/@cnippet-dev/components/scroll-reveal-2)
and [Origin UI dialog](https://preview.21st.dev/@originui/components/dialog)
patterns, with original Astro/native dialog/IntersectionObserver/Web Animations
implementation. No original React source is copied. New generic CLI catalog
search still returned Not signed in; cloud review was not retried after the
previous source-export rejection. See qa/home-refresh/POLISH_REVIEW.md.

Registration offers follow-up (2026-11-01): reuse the shared Fabio portrait and
newsletter composition already documented in marketing-design/REVIEW.md inside
the existing optional signup intent control. Keep it separate from favorites
reminders and preserve the marketing activation gate. No mobile motion or new
runtime dependency. Wishlist page surfaces use the existing light editorial
palette; detail navigation retains the dark palette and a clear orange active state.

The approved tokens are in `src/shared/styles/theme.css`. Astro builds static HTML; small Vanilla JS modules own interactions. Local Montserrat and Playfair Display, existing brand assets, and IT/EN content are required. No React or motion framework.

The home keeps its original hero, biography, destinations and Facebook review records. Selected `offerta-sharm` content supplies three service benefits, the existing four booking steps and six real Vimeo video/thumbnail associations. Campaign layout and lead flow remain independent.

21st references: [Tilt Card](https://mcp.21st.dev/@tom_ui/components/tilt-card/evade), [testimonial patterns](https://news.21st.dev/blog/react-testimonial-section-components). The public tilt description lists MIT; no third-party component source is copied. The implementation adapts the interaction pattern with our own Vanilla JS and existing assets. See `design.json` decisions.

Desktop/iPad enhancements load in a separate chunk only at >=768px with no reduced-motion preference. The portrait has real alpha transparency and separate background/foreground depth. Mobile carousels remain manual; the portrait uses the small requested CSS/touch enhancement above. Never request sensor permissions.

Plugin 21st 0.5.0 installed from 21st-dev/codex-plugin; CLI 1.18.0 used to initialize this context. Catalog search required sign-in and interactive authorization timed out. Cloud `21st review` was rejected by automatic approval review because it may export private project source. Do not claim catalog retrieval, connected MCP or cloud-review success. Local code review, browser verification and Lighthouse supply the implementation evidence.
