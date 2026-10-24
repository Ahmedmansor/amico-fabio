# Reminder preference verification — 2026-10-24

## Authorized remote execution

The user approved the two preference/consent tables, their grants and atomic
RPC, and disposable tests after the exact scope was explained. The initial
attempt was rejected by automatic approval review; no write occurred then.
Execution succeeded after the follow-up authorization. No deployment, Cron,
Brevo setting or actual mail sending was performed.

Fresh metadata preflight: both tables and RPC absent, zero noninternal Auth
user triggers, and id the only required Auth column without a default.
schema.sql was applied to fabioEgypt (iiivnvwspoikfrlclhyr).

Actual role-tests.sql output:

    Preference role assertions reached; ROLLBACK follows.

This success marker was returned before the final ROLLBACK. Assertions cover
atomic service writes, duplicate/conflicting IDs, unchanged consent start on
language changes, stale version rejection, old grants after withdrawal,
per-account request identity, audit UPDATE denial, authenticated/anonymous
SELECT and RPC denial, and account-deletion cascades. Two synthetic Auth UUIDs
had no email; fixtures were rolled back.

Follow-up metadata output:

- wishlist_email_preferences: RLS true.
- wishlist_email_consent_events: RLS true.
- service_role preferences: SELECT, INSERT, UPDATE; audit: SELECT, INSERT.
- No PUBLIC/anon/authenticated table grants.
- RPC security_definer false, search_path empty; anon/authenticated EXECUTE false,
  service_role EXECUTE true.
- preference_rows 0; audit_rows 0; ensure_rls event trigger enabled (O).

Security advisor returned two INFO rls_enabled_no_policy findings. This is
intentional: these tables allow backend-only access and have no browser grants.
Do not add browser policies just to remove the informational finding.
Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
The existing Auth leaked-password-protection warning remains unchanged; password
login is not used. Reference:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Remaining integration gates

The repository/service, remote getUser verifier and portable HTTP handler are
local source, not a deployed endpoint. No real user was subscribed. Website
opt-in, actual Edge entry/runtime, request deadlines/rate limits, trusted secret
storage, verified unsubscribe, durable event capture, queue/suppression,
Cron and sending integration remain. Deployment and recipient tests require
their own authorization. Signup/favorites never imply email consent.

Approved schedule remains one reminder 24h after max(last real addition,
consent activation). Duplicates and repeated opt-in do not reset it; empty
lists cancel waiting; refill before first send restarts waiting. Acceptance by
the provider consumes the one reminder. Pure tests do not prove delivery.

## Project checks after activation

npm test: 143 Node tests passed, 0 failed; 15 Vitest files / 140 tests passed.
npx astro check: Result (275 files), 0 errors, 0 warnings, 0 hints.
The first sandboxed build failed with [Supabase:trips] Network request failed
or timed out. The authorized network-enabled retry succeeded: validated live
Supabase 22 trips, 14 packages, 3 addons, 1 settings; static build 94 pages in
6.64s, Complete. Existing Browserslist data-age notice remains; no dependency
was changed. git diff --check passed. No push or deployment occurred.

## Browser preference flow preparation — 2026-10-24

preferences-client.ts is a fixed-endpoint HTTP adapter, not a table/RPC client.
Auth session lookup is injected; no bearer is persisted, placed in a URL/body
or logged. It refuses missing/switched sessions before dispatch, uses no-store,
omit credentials, no referrer and redirect:error, bounds JSON responses and
includes session lookup in its deadline. The backend still verifies identity.

preferences-controller.ts keeps only confirmed preferences, clears them on
account changes and discards late replies. Uncertain writes retry only after
explicit action with the identical command/request ID, blocking a conflicting
new command until resolved. An old grant retry can return a newer withdrawal
from another tab; the controller displays current server state and never
replays the old grant. It does not infer consent from Auth or favorites.

Synthetic tests: 11 transport/controller cases including an HTTP boundary
round trip. No browser, real account, deployed endpoint, runtime limits or
email delivery is claimed by these tests. Neither module is mounted on the
website yet; component/Auth binding and backend deployment remain.

Actual final checks: npm test — 154 Node tests passed, 0 failed; 15 Vitest files,
141 tests passed. npx astro check — 278 files, 0 errors/warnings/hints. Static
build — 94 pages in 5.28s, Complete. No dependencies or remote state changed.
