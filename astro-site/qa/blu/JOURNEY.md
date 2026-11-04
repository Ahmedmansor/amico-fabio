# Blu landing journey — 2026-11-04

The owner approved the premium playful landing redesign and requested the hook
"Want to see Bikini Bottom for real?" in the existing Italian/English campaign.
The owner supplied the existing Fabio biography instead of a video and then
clarified that all six character cards must remain openly visible. They now
appear openly alongside a right-hand program sidebar on desktop (1100px+),
and before the stacked program catalog on smaller screens. Biography and reviews follow the character cards immediately in the left column, avoiding the gap caused by the taller program sidebar.

The visible-only native-scroll GSAP reveal introduces a real existing trip photo. Three
adventure choices filter the four program previews through actual included
trip IDs and catalog categories. "Both" requires sea and desert memberships.
Selection prepares a reviewable WhatsApp draft, with a reset control and direct
links retained. Selection alone does not emit generate_lead.

The biography is accessed through the home data function in both existing
languages. Its first three paragraphs are visible and its full remaining text
is available in a native disclosure. Three existing reviews and the configured
Facebook source link are reused. The six character narratives, pose controls,
portal slider, itinerary details, tailor-made trip planner and passphrase remain
available. Hero copy, CTA hierarchy, spacing, cards and FAQ are owner-authorized
changes to the visual/content baseline.

There is no introduction video asset, as confirmed by the owner. The section
uses the existing real Fabio portrait. No video placeholder is published.

21st contextual references returned Expandable Card 35717, Expandable Content
Card 25336, Expanding Cards 5526 and Card 7796. The native details/card pattern
is implemented in Astro/Vanilla JS. UI UX Pro Max returned continuous and subtle
Scroll Reveal presets. Motion uses the installed GSAP with a lazy reveal module, native
scrolling and the existing hardware, privacy-overlay and reduced-motion gates.
No dependency was added. Local 21st review recognized the CSS file and reports
zero errors/warnings and 20 intentional campaign-color suggestions.

Verification
- Node 24.21.0.
- Blu domain tests, 11 passed across 3 files.
- Astro check, zero errors, warnings and hints.
- Static build, 575 pages and 232 reciprocal SEO checks.
- journey.mjs covers IT/EN at 390/1440 px, matching catalog filter tags,
  program/interest WhatsApp drafts and reset, biography, three reviews,
  visible character cards, image loading, overflow, lazy reveal, offscreen cleanup and hidden-tab cleanup.
- revision.mjs checks the four programs, six original character cards,
  itinerary details, planner navigation, Sandy draft, and artwork containment.
- External requests are blocked by browser QA. No external submission.
- Screenshots stay ignored under qa/blu/screenshots/.
- The initial build found an incorrect desert image path. It was replaced with
  the existing super_safari_5_senses poster and checks were rerun.
- Existing stale Browserslist/caniuse-lite notice remains.

The owner explicitly approved combining the pre-existing program migration
changes with this landing revision in one focused commit. Earlier browser
comparison JSON files describe the historical migration baseline. This report,
journey.mjs and the refreshed revision-results.json describe this redesign.
The preview is local at http://127.0.0.1:4387/en/blu/ and /it/blu/.
