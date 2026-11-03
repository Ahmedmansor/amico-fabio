# Home evidence and motion — 2026-10-29

The home reuses selected, existing `offerta-sharm` content through feature data functions. It keeps its original hero, biography HTML, destination links, Facebook review records, promo rules and shared shell. No packages/dependencies, prices, booking policy, backend, hosting settings or legacy source changed.

## Source mapping

| Home content | Existing campaign source |
| --- | --- |
| Based in Egypt | `TrustBadges.text.0–1` |
| Italian-speaking support | `TrustBadges.text.2–3` |
| Tailored tours / transparent prices | `WhyChooseUs.text.5–6` |
| Four booking steps | `TimelineSteps.text.2–12`, preserving the original four title/body pairs |
| Guest video heading | `VideoTestimonials.text.0` |
| Six guest videos and local thumbnails | The campaign's original six Vimeo IDs and `VideoTestimonials.image.10–15` |

`getHomeEvidence()` uses `getOfferCampaign()` and `getOfferTestimonials()`. Italian copy comes from the validated campaign; matching English home keys translate the selected source, with no new business claims. Video titles are mapped by stable Vimeo IDs. Videos remain Italian and are labeled accordingly on both home languages. The campaign stays Italian-only with its own layout, CSS, lead form and video behavior. Its video markup now reads the same validated associations instead of repeating IDs six times.

## Presentation and lifecycle

- Three service benefits, four booking steps with the existing planner CTA, and six consent-gated video cards. Original thumbnails, no invented reviewers, photos, numbers or ratings.
- The original Fabio foreground is RGBA with alpha 0–255. The original temple background and cutout remain separate optimized images. CSS perspective and foreground depth restore pointer tilt. Forehead/edges are kept within the poster; no image editing or replacement.
- `home-motion` is a separate dynamic chunk requested only at >=768px and without reduced-motion preference. Pointer/touch interaction schedules one animation frame per event batch, not an idle animation loop; no device-orientation permissions. Cleanup removes listeners, timers and styles when the media condition changes.
- Facebook cards auto-advance while visible, pause on hover/focus, stop after manual interaction, and offer previous/next and pause/resume controls. Mobile uses native horizontal swipe and manual arrows. Existing hero rotation also moves into the desktop-only module and stops when hidden/offscreen.
- No Vimeo iframe, request or preconnect before explicit play and external-media consent. Uses the existing consent category; analytics stays off in the test. Native dialog close/Escape removes the iframe and restores focus. A direct Vimeo link provides an alternative when the provider cannot play.

## 21st usage and limits

The requested plugin installed successfully: 21st 0.5.0 from `21st-dev/codex-plugin`. CLI 1.18.0 initialized `.21st/design.json` and `DESIGN.md`, filled with actual project constraints and source paths. The installed `21st-cli-use` and `21st-ui-build` skills were read and applied. Public references: [Tilt Card](https://mcp.21st.dev/@tom_ui/components/tilt-card/evade) and [21st testimonial patterns](https://news.21st.dev/blog/react-testimonial-section-components). The public tilt description lists MIT; no component source is copied. Own Astro/CSS/Vanilla implementation, no React/Framer Motion dependency or 21st service in the site runtime.

Catalog CLI search returned `Not signed in`; browser authorization opened but timed out. No successful authenticated catalog retrieval or connected MCP is claimed. Automatic approval review rejected `21st review src/features/home/presentation` because it could transmit private project source to 21st. It was not retried or bypassed. Local code review, browser screenshots and Lighthouse were used instead; no cloud-review success is claimed.

## Actual verification

- `npx astro check`: Result (569 files), 0 errors, 0 warnings, 0 hints.
- `npm run build`: 171 pages built, Complete. Static output.
- Focused content/domain verification only: existing home tests 3 passed/0 failed (original copy/reviews retained; missing new copy fails); shared video associations 1 Vitest test passed (invalid/missing/duplicate associations rejected). No Auth/backend test suite run.
- Chromium `review.mjs`: six IT/EN cases at 375/768/1280. Original hero, biography, reviews and destination text/links all preserved. No overflow/page errors. Biography open/Escape, six videos/three benefits/four steps, manual review movement, actual timed automatic movement and pause passed. Motion chunk absent on mobile; pointer transform observed at 768/1280. Screenshots are local and ignored.
- `video-review.mjs`: no Vimeo without consent; preferences opened before embedding; external-only consent with analytics off; correct iframe URL, close/Escape unload; reduced-motion chunk absent and poster static; all six campaign IDs retained.
- **Playback limitation:** the actual Vimeo player request returned HTTP 401 and displayed “We couldn't verify the security of your connection.” No video element was available in the automated browser. Embedding/consent/lifecycle are verified; actual clip playback and audio are not. Provider/account/network restrictions were not bypassed. The owner should try the actual play control and direct Vimeo alternative in their normal browser.
- Final Lighthouse 13.6: mobile performance 90/accessibility 100, LCP 3.6s, TBT 0ms, CLS .001; desktop 99/100, LCP .9s, TBT 0ms, CLS 0. Both initial accessibility findings were fixed (step-number contrast and visible video link names). See `lighthouse-summary.json`. Local gzip preview lab data, not production field measurements. Mobile LCP remains above the aspirational 2.5s target; no claim of field INP or a controlled performance improvement over earlier home measurements. No external inquiry, email or booking was sent.

Preview: http://127.0.0.1:4333/en/ and http://127.0.0.1:4333/it/ . Move the pointer over the portrait, open the biography, scroll to video cards and Facebook reviews, and try pause/resume. Repeat on mobile to check the static poster and manual swipe.
