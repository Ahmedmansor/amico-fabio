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
