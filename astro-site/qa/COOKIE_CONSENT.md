# Local cookie consent verification — 2026-10-22

User approved vanilla-cookieconsent and existing IT/EN dictionary localization.
Package 3.1.0 is pinned exactly. Installation: one package added, 298 audited,
zero vulnerabilities. Legacy source and root dependencies unchanged.

DocumentShell includes consent for main pages and Italian campaigns. Only the
current locale's messages are serialized. The 182-day consent cookie is shared
across language routes on the same host. Preferences remain accessible at the
bottom of every page. Analytics and generate_lead require consent. Withdrawal
disables Analytics and reloads to unload it. Vimeo requires external-video
consent and a second click after acceptance. Cookie-policy paragraphs describe
these behaviors. Other legacy policy descriptions were not rewritten; this
technical implementation is not certification of the full legal policy.

Initial builds failed because Supabase was INACTIVE (ENOTFOUND). The user
resumed it. Final live-Supabase build: 90 pages in 6.05s, exit 0. No fallback.
Astro check: Result (188 files), 0 errors, warnings or hints. Existing Browserslist
age warning remains.

Actual browser checks on generated dist at localhost:4324:
- English first visit displays English accept/reject/customize controls.
- Google script tags before consent: 0; after rejection: 0.
- Navigating to Italian preserves rejection; Italian preferences show both
  optional toggles off, necessary enabled/locked.
- Accept all inserts 1 Google script and enables both optional categories.
- Withdraw via Reject optional reloads the page; Google script count returns to 0.
- Italian offerta-sharm: video click while rejected opens Italian preferences;
  Vimeo frames 0. Grant external only, save, click again: Vimeo frames 1 and
  Google scripts still 0.
- English preferences at 390x844: no horizontal page overflow; panel 374.67px.
  Screenshot qa/cookie-consent-en-mobile.jpg is local and Git-ignored.

Cookie verifier: 89 content/error pages have page-language messages, preference
control and no eager Google script. Root redirect excluded. Legal verifier
passes both locales; approved cookie paragraphs are the only legacy difference.
No lead/booking form was submitted. No push or deployment for this task.
Reproduce: npx astro check; npm run build; node scripts/verify-cookie-consent.mjs;
node scripts/verify-legal-migration.mjs. Serve dist locally for browser checks.

Regression suite: npm test passed 86 Node tests and 96 Vitest tests (6 files), zero failures.
