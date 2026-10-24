# Account language persistence — local implementation checkpoint

Local policy/service/repository implemented; remote SQL and browser integration
are not activated. No email, deployment, dependency or provider change.

## Evidence

- Read-only live inspection confirmed `profiles(user_id,locale,created_at)` and
  the existing consent table columns; locale revision/source are not yet applied.
- `node --test src/features/auth/data/__tests__/locale.test.mjs`: **10 passed**.
  Real SDK with synthetic HTTP: verified identity, one atomic mutation, strict
  input/response validation, account isolation, stale/duplicate results, abort.
- `node node_modules/vitest/vitest.mjs run src/features/auth/domain/__tests__/locale-preference.test.ts`:
  **7 passed**. Follow-site/explicit mode, missing preference, stale revisions,
  unsupported language, malformed confirmation. Initial fixture type widening
  produced two Astro diagnostics; explicit fixture types fixed them.
- `npx.cmd --no-install astro check`: **317 files; 0 errors, 0 warnings, 0 hints**.
- `npm.cmd run build`: **94 static pages in 13.42s**, live public catalog validated
  (22 trips, 14 packages, 3 addons, 1 settings). The first sandboxed attempt failed
  at network access; the approved network-enabled build passed. Existing stale
  Browserslist data warning was reported; no dependency update was performed.
- No local Postgres/Supabase CLI. SQL role/concurrency tests **not run**. Node
  and Vitest results do not validate PostgreSQL execution or real RLS.

## Reviewable SQL and next gates

[Schema proposal and rollback tests](../../supabase/account-locale/README.md)
include private request ledger, revision, locale-source backfill, transactional
RPCs and the consent-RPC correction. Existing correspondence rows are preserved
as explicit; new rows follow the site. Direct browser profile locale UPDATE is
revoked in the proposal so it cannot bypass ordering. Profile creation/read and
existing ownership policies remain. Remote writes and disposable Auth fixtures
need separate authorization before execution. Multi-connection serialization
also needs actual verification before deployment.

No switch persistence/endpoint is enabled and the existing restricted email job
still fixes English. Track continuation in
[PLAN.md](../../src/features/auth/PLAN.md#61-approved-language-and-request-contract--2026-10-24).

## Browser coordination continuation

Ten additional Node tests passed for the local coordinator and per-tab pending
store: rapid return to the cached language, lost acknowledgement, same-ID retry,
restore without automatic writes, external conflict, account change, read retry,
newer remote revisions, expiry and blocked storage. Combined data suite: 20 passed.
The first check found one fixture-inference hint; an explicit Promise annotation
fixed it. Final Astro check: 320 files, 0 errors/warnings/hints. Static build:
94 pages in 8.94s. These tests use synthetic persistence, not browser/SQL RLS.
No UI binding, endpoint, keepalive transport or deployment was enabled.
