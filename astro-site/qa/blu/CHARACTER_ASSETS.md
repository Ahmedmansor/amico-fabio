# Character artwork update — 2026-11-04

Installed the previously generated transparent Squidward portrait in both Blu languages, replacing the inline SVG. Astro generates responsive WebP derivatives. The presentation clips the bottom 1% to hide a generation artifact at the image edge; the source image is retained unchanged. Decorative artwork remains hidden from assistive technology alongside the existing card title.

The initial Plankton generation was rejected with `moderation_blocked` / `other`. A user-requested retry with the same prompt succeeded. Installed the transparent `plankton-illustration.png` with responsive Astro WebP derivatives, replacing the old SVG. The user then requested closer spacing: the pair now uses centered 170px/85px maximum grid columns with no gap instead of filling the entire card width.

Attempted Plankton prompt: Create a standalone cheerful Plankton illustration inspired by the reference: green body, single yellow eye with red pupil, long antennae, happy open smile, both arms raised. Clean cartoon ink outlines. Entire character including antennae visible, centered with padding. Transparent background. No stool, scenery, lettering or border. Website character cutout.

Verification on the final source:
- `npx astro check`: 772 files, 0 errors, 0 warnings, 0 hints.
- `npm run build`: 575 pages built; 232 canonical/hreflang pages verified. Existing Browserslist freshness notice remains.
- `node qa/blu/revision.mjs`: 4 IT/EN mobile/desktop cases passed, artwork contained, no horizontal overflow or browser errors. No external submission.
- Reviewed local `screenshots/revision-squid.png`; screenshots remain ignored.
- `git diff --check`: passed. Unrelated legacy home image change excluded.

The initial sandbox check could not reach the catalog; the subsequent authorized network-enabled check and build above succeeded.

Plankton follow-up: the four browser cases passed after image replacement, before the final spacing adjustment. After spacing, Astro check again reported 772 files with zero diagnostics and the build completed with 575 pages. The user visually approved the final spacing; the browser suite was not repeated for that adjustment.
