# Auth protection SQL — local review artifact

Not applied to Supabase. Runtime/hook activation requires separate authorization.
Read [the hook runbook](../functions/auth-send-email/README.md) before any change.

`schema.sql` proposes:
- Maintained known disposable-domain catalog; STABLE validation reads current
  table contents, including on sign-in by existing accounts.
- Recipient cooldown/hourly counters, separate global hourly and UTC-day counters.
- Hash-only delivery ledger and `reserve_auth_email` / `finish_auth_email` RPCs.
  A common transaction advisory lock also serializes the first bucket insertion.
  All eligibility/limit checks precede counter updates; blocked requests consume
  no quota. Explicit provider rejections still count as conservative attempts.
- No browser access to tables/RPCs; service_role can call only reservation and
  settlement RPCs. supabase_auth_admin can call only Before User Created. Tables
  have RLS and no direct grants to either role. Definer functions use an empty
  search_path, qualified tables and `extensions.digest` (pgcrypto prerequisite).
- Retirement of the unsafe old SQL send hook and old consume-rate function.
  Never select a validation-only SQL function as the Send Email hook.

`role-tests.sql` switches real roles, tests negative grants, maintained-catalog
blocking, admission/settlement, replay/unknown quarantine, rejected-request quota
accounting and the daily cap surviving an hourly reset. It ends in ROLLBACK.
Run on an isolated reviewed test DB: it temporarily clears counters/ledger inside
that transaction and holds the same advisory lock. Do not run during live sending.
The separate two-session concurrency gate in the file also needs real evidence;
a single transaction or JS mock is not a Postgres concurrency test.

Native SQL and Deno execution were unavailable locally. Local Node tests verify
HTTP, dispatch and RPC transport contracts, not database permissions/execution.
Before activation allocate Auth's daily share of the total Brevo account capacity,
confirm reset timezone and retention/recovery procedures, run the SQL tests and
measure the deployed five-second hook budget. DNS checks cannot prove mailbox
existence; known-domain blocking cannot detect every temporary mailbox.
