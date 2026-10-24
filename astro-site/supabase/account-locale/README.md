# Account locale persistence — applied storage, local integration

Applied on fabioEgypt after explicit user approval, migration `20261024203756`
(`account_locale_preferences`). Two-account rollback role tests passed and left
zero command/preference fixtures. No new dependency, browser endpoint, deployment
or email send. Canonical behavior:
[PLAN.md section 6.1](../../src/features/auth/PLAN.md#61-approved-language-and-request-contract--2026-10-24).

## Applied database delta

- Add `profiles.locale_revision` for optimistic concurrency and an append-only,
  private `account_locale_commands` ledger for account-scoped idempotency.
- Add email `locale_source`. Preserve existing rows as `explicit`; new preference
  rows default to `follow_site`. Existing languages/consent timestamps are not
  rewritten by the backfill.
- Service-only `read_account_locale` and `change_account_locale` use the same
  account advisory transaction lock as consent. One mutation changes site/email
  language and revision atomically. No profile/preference is created implicitly.
- Replace the existing consent RPC without changing its signature or audit
  identity behavior. Consent saves and withdrawals preserve explicit email
  language; follow-site uses the stored profile language. Require a profile first.
- Revoke authenticated direct `UPDATE(locale)` to prevent bypassing ordering;
  retain existing profile INSERT/SELECT and ownership RLS. Grant only needed
  profile columns to the private backend role. No catalog grant change.
- No enabled/consent time/wording/audit changes from language writes. No scheduler,
  sender, new consent, provider or hosting setting changes.

These retained source files follow the project's schema.sql workflow. The remote
MCP migration has a history entry; no local CLI history file was fabricated.
Supabase CLI/Postgres are not installed locally. Do not rerun this schema or the
old account/consent schema files.

## Conflict and retry protocol

Read returns a coherent account snapshot. Each explicit choice supplies a UUID
and the last confirmed revision; no client ownership or clock. The database
rejects stale revisions without side effects. A duplicate accepted UUID returns
current state without replay; changing its payload is rejected. Two accounts may
use the same UUID independently. Ledger rows cascade on account deletion; plan
storage retention before large-scale launch without weakening replay safety.

Local browser coordination is implemented in auth/data/locale-coordinator.ts:
serialize account requests, preserve the newest pending choice, skip confirmed
unchanged choices, and never automatically rebase a stale conflict. Uncertain
writes retry the same identity; account epochs ignore late replies. After navigation,
an existing captured command can receive one automatic same-ID recovery, with
its budget persisted first. No captured revision/exhausted budget/failed budget
storage means manual recovery only. Ordinary loads do not write. The pending-store adapter accepts
per-tab sessionStorage (not shared localStorage), scopes records by account and
requires an explicit expiry. It rejects unexpected fields/credentials and reports
failed durability. The header/account view binding is implemented behind
`PUBLIC_ACCOUNT_LOCALE_ENABLED=0`; it is not connected to a deployed endpoint.
Per-tab display caching avoids repeat reads for five minutes; opening the account
dialog explicitly refreshes it. Cache values never authorize writes/consent.
Do not enable the switch before backend and real integration checks are ready.

## Review and activation gates

1. Completed: live columns/grants/consent definition reviewed; separate schema
   and two-account rollback-test approval received and executed.
2. Completed: migration success and role assertions; zero preference/command
   rows afterward. Profile INSERT/SELECT retained, browser locale UPDATE/RPC denied.
3. Advisors: four intentional INFO entries for service-only RLS tables without
   browser policies; existing leaked-password-protection warning unchanged.
   A two-request lock probe returned `not-overlapping`; it does **not** verify
   concurrent connections. Actual overlapping lock verification remains pending.
4. Compose the protected endpoint with
   remote Auth validation, origin/body/deadline/rate limits. Its account identity
   must come from verified Auth; private RPC `p_user_id` is not a public API.
5. Integrate profile loading/switch/settings and IT/EN UI, then request-driven
   immediate email locale separately. Current English-only test is unchanged.

Local domain tests exercise following/explicit/missing preferences, stale writes
and strict supported-language parsing. Data tests exercise the real Supabase SDK
with synthetic HTTP responses; these are not real RLS or Postgres execution.

Sources: [Supabase database functions](https://supabase.com/docs/guides/database/functions),
[Postgres advisory locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS).
