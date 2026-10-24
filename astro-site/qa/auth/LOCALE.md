# Account language persistence — local implementation checkpoint

Local policy/service/repository implemented; remote SQL is applied and role-tested
after separate approval. Browser integration is not activated. No email,
deployment, dependency or provider change.

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

## Authorized remote activation — 2026-10-24

User separately approved schema and temporary Auth fixtures. Live preflight:
zero preferences, no custom Auth triggers, no existing ledger; authenticated had
column-only locale UPDATE and service role had no profile SELECT/UPDATE.
Migration `20261024203756` / `account_locale_preferences` returned `success: true`.
`role-tests.sql` reached `Locale role assertions reached; ROLLBACK follows.`
Assertions covered following/explicit mode, no implicit consent, unchanged consent
timestamps/history, duplicate identity, conflicting payload, stale revision,
withdrawal, cross-account RLS, denied browser/anonymous RPC and command access,
direct UPDATE denial and account cascade. Post-rollback preferences/commands: 0.
Read-only verification: ledger RLS true, functions invoker with empty search path,
browser UPDATE/RPC false, service RPC true, browser profile INSERT/SELECT true.

Two overlapping MCP requests attempted an advisory-lock probe without creating
accounts. The result was `not-overlapping`, so simultaneous-connection behavior
is **not verified**. No timeout/serialization claim is made from that probe.
Security advisor has four INFO findings for deliberately policy-free private
tables and the existing leaked-password warning; no public grants were added.
References: [RLS information](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
Earlier local-proposal paragraphs above are historical evidence, superseded here.

## Protected HTTP transport — local only

Backend handler and browser transport are implemented with a shared pure
confirmation validator for RPC/HTTP. Eleven HTTP tests plus the previous 20 data
tests passed (31 total); the 7 domain tests passed. Coverage includes round trip,
headers-only bearer, verified owner, denied origins, Auth/limiter outages,
rate limiting, body size/deadline, malformed confirmations, conflicts and bounded
session restoration. The disabled Edge entry test read zero environment values
and returned 503. Package preparation verified 13 explicit files/imports without
reading secrets or uploading. Astro check: 325 files, 0 errors/warnings/hints.
Static build: 94 pages in 10.81s. Deno/native deployed startup is not verified;
configuration remains disabled, no endpoint deployed and no header binding yet.

## Gated header and account view — 2026-10-25

Current source binds the explicit language anchors and a correspondence-language
picker inside the existing account dialog only when `PUBLIC_ACCOUNT_LOCALE_ENABLED=1`.
Default, hosting and ignored local flags were not enabled. Endpoint is derived
from the Auth project; enabling requires existing account-profile integration.
It reuses Auth's restored identity and the existing bearer access method.
Optional per-tab display cache lasts five minutes; explicit dialog opening forces
a fresh read. Pending recovery stores no credentials, email address or consent.

Recovery refinement supersedes the earlier explicit-only local checkpoint:
after navigation, an already captured explicit command may receive one automatic
same-ID retry. Its consumed budget must be durably stored first; no captured
revision/exhausted budget/blocked storage means manual retry. This prevents both
endless load-time writes and asking for confirmation after every normal language
navigation. All writes still use server revision/idempotency and verified owner.

Standalone Chrome checks passed 4 IT/EN cases at 375/1440px: field labels, keyboard
access, explicit/follow-site save, reload cache, unknown-result retry, conflict,
account switch, no implicit preference, real anchor navigation and recovery,
44px targets, no overflow/page errors. The mock server saw 2 reads and 8 writes
including intentional retries across each complete multi-action scenario.
Initial browser failure revealed native `fetch` called with the wrong receiver;
the binder now supplies a context-free wrapper. An initial standalone fixture
omitted legacy theme variables; its shell was corrected before visual review.

Full main-site Auth checks passed another 4 cases: synthetic Google SDK session,
dialog/heading, new control, keyboard focus trap, one successful save, no reads
from periodic Auth rendering, signout and home redirect without new locale reads.
Each scenario had 2 reads (initial load and explicit dialog refresh), 1 write,
1 logout, zero page/unexpected-network errors. Synthetic endpoint only; no real
user token, Google connection, preference subscription or email dispatch.
Screenshots are ignored/local; result JSON and scripts are committed.

Reproduce the two isolated previews from astro-site:

```powershell
node qa/auth/build-locale-preview.mjs
node scripts/serve-static-qa.mjs .astro/account-locale-ui 4334
# Separate terminal: set PLAYWRIGHT_MODULE/QA_BROWSER to existing local runtime paths.
node qa/auth/locale-browser.mjs
node qa/auth/build-locale-auth-preview.mjs
node scripts/serve-static-qa.mjs .astro/account-locale-auth 4335
node qa/auth/locale-auth-browser.mjs
```

Build helpers use only temporary child-process settings; no .env.local or hosted
configuration is modified. The first removes its exact generated route in finally.
Earlier unmounted/explicit-only paragraphs are historical checkpoints.

Final verification for this UI task: `npm test` passed **222 Node tests** and
**18 Vitest files / 152 tests**; Astro check passed **337 files, 0 errors,
0 warnings, 0 hints**. Normal `npm run build` generated **94 pages in 9.89s**.
An explicit generated-HTML assertion confirmed default-off settings markup is
absent. The synthetic enabled full-shell build generated 94 pages in 9.89s;
its four browser cases passed after the final field-label refinement. Default
build and QA artifacts remain local and unpushed. Native/live endpoint activation
and real authenticated locale persistence are still unverified.
