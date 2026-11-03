# Appearance and mobile wordmark — 2026-11-02

Owner correction: keep the Fabio Egypt wordmark visible on mobile, reduce all
header icons to make room, use genuinely light surfaces in Light and neutral
black/gray surfaces in Dark. The earlier navy dark palette was replaced before
this task was committed. Appearance lives in the mobile menu and a desktop
header disclosure, with system/light/dark choices.

Shared surface/text/focus tokens replace light-only CSS references across
main-site consumers. Their light values are unchanged. White-on-brand and
orange-action foregrounds remain stable. Browser automatic dark recoloring is
disabled for the explicit Light scheme; no claim is made about extension-driven
style overrides. Campaigns omit preference bootstrap and retain their layouts.

## Real verification

```text
Node v24.21.0 (existing pinned external runtime).
Vitest: 3 test files passed, 54 tests passed (theme, currency, booking).
Final npx astro check: Result (626 files): 0 errors, 0 warnings, 0 hints.
Final npm run build: 199 page(s) built in 20.95s; Complete!
Theme/header browser QA: 9 focused cases passed.
git diff --check: no whitespace errors.
```

The final browser run was narrowed after the owner requested avoiding repeated
unrelated checks. It covers the header/wordmark at 320/375/1280px, explicit
light/dark and system changes, reload persistence, sampled dark text contrast,
cross-tab and unavailable/invalid storage. The reported home benefits section,
login and tour detail were compared between themes in Italian on mobile.
Header computed colors are asserted white in Light and #191919 in Dark.
Visible main/benefit text is identical across the compared themes. Campaign
isolation and the no-JavaScript catalog fallback were also checked. See
`results.json`; screenshots are local and ignored. No email/booking was sent.

The initial browser draft stopped because the home page has no `main` element;
the focused check uses its actual `.home-evidence` section. No pass is claimed
for that aborted draft. No new service, dependency, remote schema or hosting
setting was changed. The installed 21st CLI was unavailable; controls reuse the
project's existing native disclosures, with ui-ux-pro-max keyboard guidance.

Run `browser.mjs` against a built local preview with `QA_ORIGIN`, an external
bundled Playwright `PLAYWRIGHT_MODULE`, and installed Chrome `QA_BROWSER`.
