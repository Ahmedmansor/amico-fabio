# Restricted activation — 2026-10-25

User explicitly approved the consolidated activation: account
conantotta@gmail.com only, EN/IT QA once each within 24 hours, one optional
real reminder after 24 hours, daily reminder attempt budget 5, management links
90 days, ingress 60/minute, Cron every 15 minutes, fixed Brevo webhook and
amico-fabio-test only. Main, legacy site and domain are excluded.

Applied activity, cron-auth, dispatch queue, provider-event and durable QA-ledger
migrations. Enabled pg_cron and pg_net. Activity and dispatch native SQL assertions
passed with ROLLBACK and no HTTP. Updated the activity fixture to the current v2
consent RPC; the old RPC is intentionally denied to service_role.

Deployed dispatch v1, management v1, preferences v4 (localhost + stable test
origin), bilingual durable QA v4. Google callback allowlist now also contains
the two stable test-host IT/EN callback paths. Vercel test project Production and
Preview have public Google/sync/preferences/management configuration; QA button
stays local only. No private key is used in browser configuration.

Required checks: Astro 387 files, 0 errors/warnings/hints. Static build 96 pages
in 11.83s, catalog 22 tours / 14 packages / 3 addons, SEO 90 indexable pages.

Remaining in this activation: publish current branch to the test host, verify
management routes and noindex, activate Cron/fixed webhook, verify runtime
metadata and provide final user test instructions. No live customer email
delivery or completed Google login is claimed by these SQL/source checks.
