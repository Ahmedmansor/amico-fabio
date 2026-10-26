# Auth protection SQL — applied and verified 2026-10-27

Applied on fabioEgypt under standing execution authorization. Both Auth hooks are active.
Read [the hook runbook](../functions/auth-send-email/README.md) before any change.

`schema.sql` defines the applied protection:
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
The separate concurrency gate passed using independent sessions 433810 and 433830:
the owner returned send, the contender waited 778.497ms and returned uncertain.
Only that test's fixture and quota contribution were removed; zero test rows remained.
See `../../qa/auth/activation-2026-10-27.json` for the evidence.

Native Deno checking and remote SQL role assertions passed. Actual Auth requests
proved maintained-domain blocking (403) and signed send-hook DNS rejection (400),
with no test users left. DNS checks cannot prove mailbox existence; known-domain
blocking cannot detect every temporary mailbox. Real inbox and cross-browser
acceptance remain the user's final test.
