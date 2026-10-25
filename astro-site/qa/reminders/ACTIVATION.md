# Restricted activation — 2026-10-25

**Current outcome: restricted activation is ready for the user's integration
test.** Brevo webhook registration returned 200/configured; webhook_ready=true,
Cron active=true on */15 * * * *. Delivery still requires the user's explicit
consent and 24-hour eligibility. No real email was sent by this activation.

After explicit approval at action time, added only Webhooks Read/write to the
existing restricted API key. User completed Brevo's email verification themselves.
No key was generated, revealed, copied or rotated; original three scopes and
expiry are unchanged. Brevo permission propagation initially retained 403, then
the empty account returned 400/document_not_found. Dispatch v6 handles exactly
that empty lookup; other lookup errors still fail closed. Existing fixed callback
ownership remains checked before updates. The authenticated setup confirmed ready.

Latest checks: nine targeted runtime tests passed; Astro 387 files with zero
errors/warnings/hints; static build 96 pages in 8.81s. QA remains local-only,
once per language for conantotta@gmail.com until 26 October 2026 05:21 Cairo.
Google sign-in, consent saving, final mailbox delivery and actual provider-event
receipt remain the user's integration checks; readiness is not a delivery claim.

## Activation history

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

Published commit 9165691 to the migration branch. Separate test deployment
CphNJ39pYkhX2v1t1cC9n4fXLaW8 is Ready on the stable test hostname. IT/EN wishlist
and management routes returned 200/noindex; consent controls are present. QA
controls are present locally and absent on Vercel. Google callback allowlist has
both existing localhost paths and two stable test-host paths; no wildcard host.
Account-locale v2 and preferences v4 allow these two exact origins.

Cron fabio-wishlist-reminders is active on */15 * * * * with its scoped token
generated/stored inside Postgres Vault, never returned to the agent. Authenticated
bootstrap failed at Brevo lookup with HTTP 403 / permission_denied. webhook_ready
remains false, so final send admission is blocked. Brevo sign-in with the test
recipient's Google account did not identify an existing Brevo user; user login to
the correct Brevo account is requested. No credential changes or alternate-account
guesses were made. Inspect provider permissions before retrying the fixed setup.

Dispatch v4 adds bounded authenticated bootstrap diagnostics (stage/status/known
reason only), never provider text or credentials. Eight targeted runtime tests
passed, including 403 readiness fencing and empty successful lookup handling.
Astro check: 387 files, 0 errors/warnings/hints. Build: 96 pages in 11.19s.
Native tests left no dispatch/QA jobs or subscriptions. Existing security advisor
warning about leaked-password protection is unchanged; private service-only tables
have RLS with no browser policies by design. No customer email or actual Google
login is claimed verified. Final mailbox and signed-in UI tests remain user checks.
