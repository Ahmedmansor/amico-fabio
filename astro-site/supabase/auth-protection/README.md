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

## Confirmed provider block and maintained-catalog proposal

`block-playfine.sql` was applied after the user confirmed that temporary provider.
The matching seed is included in schema.sql for fresh setup. A real Auth request
was rejected with 403, and existing-send admission rejected it under service_role.
Legitimate Libero and the Fabio private domain were checked and remained allowed.

`data/` contains an immutable upstream snapshot, checksum and CC0 license from
https://github.com/disposable-email-domains/disposable-email-domains. It is not
served publicly or bundled into browser code. The backend SQL catalog is the
source of truth; the short browser list provides immediate feedback for known
providers, including playfine.com.

The 9,927-domain bulk import is prepared but NOT executed. Automatic approval
review rejected its broader signup impact without an explicit user decision.
Do not treat standing technical authorization or a successful local generator as
approval to apply this proposed bulk policy. The pending user choice controls it.

To reproduce the reviewed artifact offline from astro-site/:
`node scripts/update-disposable-domains.mjs`
This checks the pinned snapshot's checksum and writes only ignored generated SQL
to `.astro/auth-protection/disposable-domains.sql`; it never executes SQL.
`--refresh` fetches a new immutable revision for review, or `--revision <full SHA>`
pins a chosen revision. Syntax, size, trusted provider exclusions and CC0 license
are checked. Manual blocks remain separate from source-managed rows. Review the
diff and false-positive risk before any future approved import; neither a list
nor DNS can guarantee detection of every newly created temporary mailbox.
