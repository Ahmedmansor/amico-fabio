# Rounded shared footer — 2026-10-29

The shared main-site footer now has rounded corners on all sides, page-edge/bottom spacing, and the existing approved navy surface. Social links use white inline SVGs in a centered row with 44px targets and at least 12px gaps. A thin theme-derived divider separates the social row from the centered copyright. The existing Cross Roots heritage, biography, headings, email and navigation links are retained. Campaign-specific footers remain independent.

`SocialIcon.astro` owns the four local vector marks; no external icon library, requests or JavaScript were added. Instagram uses clean outline geometry. Hover only adds a subtle surface and lift for fine pointers; reduced motion disables transitions. Focus uses the approved orange on the dark footer.

Verification:

- `npx astro check`: Result (571 files), 0 errors, 0 warnings, 0 hints.
- `npm run build`: 171 pages built, Complete.
- Chromium before/after: nine cases, widths 375/768/1280 across the English home/tour and Italian article. All original text/link facts preserved; zero overflow or page errors; four white icons, 44px targets, rounded/inset footer and social divider confirmed. Desktop home/tour and mobile home screenshots manually inspected. Screenshots/raw Lighthouse output remain ignored.
- Focused Lighthouse accessibility: 100, zero failing audits; recorded in `lighthouse-summary.json`. No broad domain/Auth/backend tests were run for this reversible presentation change. No dependencies or external messages/deployments.

Preview: http://127.0.0.1:4333/en/#global-footer . Check the outer corners, white social row and separator on the home and any main-site article or tour.
