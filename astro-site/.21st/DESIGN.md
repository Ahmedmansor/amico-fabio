# Fabio Egypt design context

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
