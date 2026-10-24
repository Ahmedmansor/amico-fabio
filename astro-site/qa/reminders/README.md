# Wishlist email preparation

No Brevo sender, remote reminder schema, Cron or actual email has been enabled.

## Published catalog manifest — 2026-10-24

`/tours-manifest.json` is a prerendered JSON endpoint. reminders/data reads the
existing tours/packages data APIs, generates email-friendly JPEG variants and
maps only public published identity, title, price and link/image fields. Pure
domain validation rejects invalid prices, missing translations, duplicated
kind-specific IDs/slugs, wrong links and mismatched image origins/dimensions.
It includes no user IDs, wishlist rows, provider source columns or credentials.

DEV uses the request origin and test environment. Builds use the shared asset
origin, which already requires a separate explicit origin for noindex previews.
Production-flavor local output represents production URLs but is not deployed;
do not send test mail from it. Preview generation must explicitly use test output.

Actual checks:
- npm test: 129 Node tests passed, 0 failed; 12 Vitest files / 123 tests passed.
- Astro check: 256 files, 0 errors/warnings/hints (before adding this QA script).
- Default build: 94 HTML pages, 9.05s, Complete; JSON is a separate static file.
- Noindex test build in .astro/email-catalog-test: 94 pages, 8.51s, Complete.
- verify-catalog.mjs: both outputs passed 22 tours, 14 packages, 72 localized
  title/price/link comparisons and all JPEG file checks. Production origin was
  https://fabioegypt.com; test origin http://127.0.0.1:4330, environment=test.

Reproduce: `node qa/reminders/verify-catalog.mjs`. For test output, set QA_DIST,
QA_EXPECTED_ORIGIN and QA_EXPECTED_ENVIRONMENT explicitly. No credentials print.
Future sender must validate the manifest, enforce environment/recipient/freshness
rules, and defer on failure rather than send stale or mismatched prices.

## Local summary/reminder template — 2026-10-24

No framework/dependency was added. Presentation contains a provider-independent
HTML/plain-text renderer and inline styles; data holds matching IT/EN copy;
pure domain selects only saved published items and reports unavailable IDs.
It rejects environment mismatch and invalid card limits, and requires a trusted
unsubscribe URL for reminders. Inputs are escaped in HTML; subject CR/LF is
rejected. Tables, system fonts and build-generated 16:9 JPEG crops keep the draft
independent of website styles. Summary text does not implicitly subscribe users.

Actual output:
- npm test: 133 Node tests passed / 0 failed; 13 Vitest files / 129 tests passed.
- Astro check: 265 files, 0 errors, 0 warnings, 0 hints.
- Default final build: 94 pages in 6.10s, Complete; manifest comparisons passed.
- Final noindex test build: 94 pages in 7.07s, Complete; all 72 page comparisons
  and JPEG files passed, with only localhost:4330 links.
- preview.mjs generated four IT/EN summary/reminder HTML + plain-text drafts.
- browser.mjs passed eight combinations (375/1440, IT/EN, summary/reminder):
  four loaded images, separate groups, no horizontal overflow, local requests
  only, inert unsubscribe preview and no page errors. Final mobile and desktop
  screenshots were inspected locally; screenshots remain ignored.

Run instructions and editable source map: ../../src/features/reminders/README.md.
Draft copy, launch card limit and reminder timing/re-addition still need review.
The local preview server is available on 4330 for review; 4322 user Auth/session
was not modified by preview generation. No email, remote schema, Brevo/SMTP
setting, hosting environment, push or deployment changed during these tasks.

Reference for client CSS support:
[Gmail CSS documentation](https://developers.google.com/workspace/gmail/design/css).
Actual inbox and delivery checks remain separate authorized tests.
