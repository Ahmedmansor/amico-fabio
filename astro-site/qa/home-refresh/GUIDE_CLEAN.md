# Clean Sharm Secrets guide — 2026-11-02

Owner requested a cleaner guide using 21st and UI UX Pro Max, removal of
decorative backgrounds, existing site typography, a WhatsApp-style index, SVG
instead of emoji, and a maximum photo height to stop rule 5 stretching rule 6.

Replaced the duplicated legacy guide CSS with scoped light editorial styling.
Use existing local Montserrat/Playfair, shared tokens, readable text and native
index/gallery dialogs with focus/Escape/backdrop handling. Index has the same
white/orange pill composition and periodic icon nudge as WhatsApp. Six background
render requests are removed; all original words/content photos and data/domain
files remain. Inline SVG replaces decorative emoji at rendering time, including
index labels and captions. Card photos are capped at 360px; cards align at their
own height and photos follow descriptions rather than being pushed down by a
stretched neighbouring card. The existing project visible-only gallery scheduler
replaces the constant background interval, with pause control/reduced motion.

21st contextual search `editorial guide table of contents` succeeded; reference:
https://21st.dev/@mohammadshehadeh/components/toc . Existing Astro/native controls
reused, no React/source copy/dependency. Applied supplied UI UX Pro Max rules:
SVG structural icons, contrast, local fonts, focus/44px controls, restrained
motion and readable line lengths. No hosted source review upload (prior export
rejection respected).

Verification kept narrow at the owner's request: required Astro check (606 files,
0 errors/warnings/hints) and static preview build (171 pages; bundled editorial
guards 70 metadata/link and 50 JSON-LD checks). Four final UI cases only: IT/EN
375/1280, matching before/after screenshots and all guide words/photos/index
targets compared (intentional emoji-to-SVG normalized). Native index/gallery,
Escape/focus return, navigation, no backgrounds, no visible emoji, 360px image
cap, no overflow/page errors passed. Reviewed phone/index/desktop and rule 5/6
screenshots; lazy image decode/compositor timing can affect screenshots, so
both real source photos were also inspected. Screenshots stay local/ignored.
No broad test suite or Lighthouse run, no external submissions or hosting flag
changes. QA script and JSON snapshots are alongside this report. Real deployment
verification is recorded separately after publication.

Application 1194ae2 is Ready on existing amico-fabio-test, deployment
https://amico-fabio-test-2d4i0papv-fabio-landing-pages.vercel.app (18s build),
confirmed alias https://amico-fabio-iyzo.vercel.app . Two final public-host smoke
cases passed (IT desktop/EN mobile), including the same copy/photo associations,
native dialogs, index targets, SVG replacements, backgrounds and 360px photo cap.
See guide-clean-deployed.json. No broad/deployed performance suite was run.
