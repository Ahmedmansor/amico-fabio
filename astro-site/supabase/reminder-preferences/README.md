# Reminder preference storage proposal — NOT APPLIED

Local source only. Applying this new user-data schema requires separate approval;
the account-wishlist schema/test authorization does not cover these tables/RPC.
No PostgreSQL execution or passing database role result is claimed for this SQL.

## Exact proposed scope

- wishlist_email_preferences: one per-account current reminder preference,
  language, consent wording version and trusted server timestamps. enabled_since
  changes only on disabled-to-enabled transitions, so language changes or saving
  an already enabled preference do not restart the reminder clock.
- wishlist_email_consent_events: append-only grant/withdrawal history, wording
  version, language, source, server timestamp, and unique (user_id,request_id).
- RLS enabled on both tables, no anon/authenticated/PUBLIC table access and no
  browser policies. Only a trusted backend can read/update through its role.
- change_wishlist_email_preference: SECURITY INVOKER, empty search_path,
  service-role-only EXECUTE. It takes identity only from the future verified
  backend, not from browser JSON. No SECURITY DEFINER or Auth signup trigger.
- One atomic transaction updates state and appends its audit event. Per-account
  advisory locking prevents racing retries. Reusing a request ID with different
  fields fails; a genuine old retry returns current state and cannot replay a
  prior opt-in after a later withdrawal. Clients never supply audit timestamps.

The existing service adapter is unbound and not imported by browser code. It
accepts a trusted backend client; no secret is read from files or committed.
No public HTTP endpoint exists yet. Reading an absent preference never enrolls
a user or creates records. Explicit enrollment requires the current displayed
wording version; withdrawal is not blocked by an old displayed version.

The two FK references propose account-deletion cascades, matching the current
account feature. Final retention/export/suppression requirements still need
review before launch; these tables do not define a permanent audit-retention
policy. No copied email/name, delivery queue, unsubscribe token store, sending
function, Cron, or Brevo configuration is added here.

## Before activation

Review the SQL and final IT/EN consent wording, run a fresh metadata preflight,
then obtain authorization to apply and to use disposable role-test fixtures.
Verify anon/authenticated denial on tables and RPC, service-role atomic changes,
idempotency conflicts and stale retries, audit integrity and account cascades.
The prepared role-tests.sql uses two synthetic Auth UUIDs with no email, covers
backend atomic changes, duplicate/conflicting requests, stale grant after
withdrawal, stable consent start, browser/anonymous denial and cascades, then
ROLLBACK. It requires explicit disposable-write approval; it has not been run.
Read-only preflight on 2026-10-24 confirmed both tables and the RPC absent, no
noninternal Auth user triggers, and id the sole required Auth column without
a default. Recheck immediately before any separately approved execution.
Browser activation additionally requires
an authenticated backend handler that validates Auth and binds ownership before
calling the service, origin/request/rate-limit protections and no raw logs.
Never expose the backend key through public Astro configuration.
