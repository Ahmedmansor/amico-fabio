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

## Draft preference UI

ReminderPreferences.astro and preferences-view.ts are prepared but not mounted
in WishlistPage. The control is hidden until bound to an authenticated controller,
starts unchecked for an absent preference, and uses explicit form submission.
Loading/saving disables inputs, errors restore confirmed state and expose an
explicit retry. The binder hides and clears account-specific display on signout.
No skeleton animation is needed for this text/status control; layout and status
space are reserved and busy state is accessible. Existing black/gold variables,
local fonts, visible labels/focus rings and 44px controls are used.

Draft copy exists under data/content/preferences-it.json and preferences-en.json;
matching keys are validated. Review the wording before enabling real consent.
The preview uses in-memory fixtures only. Browser JSON covers four IT/EN cases
at 375/1440px: keyboard activation, default unchecked/no writes, failure after
simulated commit then exact-ID retry, late account replies, no overflow, local
requests only and no page errors. Screenshots remain ignored and were inspected.
No claim of real endpoint security, consent activation or email delivery follows.
See README.md in this QA folder for regeneration and preview instructions.

Final UI task checks: npm test — 154 Node tests passed, 0 failed; 15 Vitest files /
141 tests passed. npx astro check — 284 files, 0 errors/warnings/hints. Normal
static build — 94 pages in 5.22s, Complete. Isolated noindex preview build — 96
pages in 12.21s, Complete. Four browser cases passed. No new dependency, remote
write, user subscription, email, hosting change, push or deployment in this task.

## Separate Edge runtime preparation — local only

The prepared entry composes remote getUser, separate public-Auth/backend-data
SDK clients, current preference/audit RPC and a proposed database-backed limiter.
The counter schema and role fixtures are NOT APPLIED/RUN and have not been
parsed by PostgreSQL. No new remote write or deployment occurred in this task.
The configuration is explicitly disabled; a Node test with mock Deno proves
that this guard returns 503 without reading runtime secrets. Native Deno/CLI
are unavailable locally; no installation was performed or native Edge result
claimed. Packaging validates 13 explicit source/config files and relative imports.

Eight new runtime tests use the actual pinned supabase-js SDK against synthetic
fetch responses: verified owner binding, backend credential isolation, separate
read/write quotas, limiter denial/outage blocking data access, Auth 429 remains
unavailable rather than false signout, incoming stalled-body timeout, bounded
upstream response/body deadline, malformed limits/config fail closed, and the
disabled entry guard. No real user session or privileged credential was read.

Proposed review settings: 30 reads and 10 writes per 60 seconds/account, local
4322 origin only, incoming 4096 bytes, upstream 65536 bytes, network 10000ms,
body 5000ms. These numbers are proposals, not approved/active defaults or mail
allowance. See ../../supabase/functions/wishlist-email-preferences/README.md
for exact code/package/deployment gates and authentication mode. Gateway/IP
controls before Auth verification and project budgets still need launch review.

Actual final checks: npm test — 162 Node tests passed, 0 failed; 16 Vitest files /
142 tests passed. npx astro check — 292 files, 0 errors/warnings/hints. Static
build — 94 pages in 5.53s, Complete. No new dependency or version change.

## Authorized activation — 2026-10-24 (supersedes local-only status)

The user explicitly approved the counter schema, disposable tests and service
deployment at 30 reads/10 writes per minute/account. Schema applied. Actual SQL
output: Rate role assertions reached; ROLLBACK follows. Follow-up: RLS true,
counter rows 0, browser/anon SELECT false; RPC SECURITY INVOKER, anon/browser
EXECUTE false, service EXECUTE true.

wishlist-email-preferences version 1 deployed ACTIVE, verify_jwt=false with
in-function getUser. Deployment id 71f36c77-979c-4e8e-a79d-9f2fff850b1c.
Live smoke: OPTIONS 204 with allowed CORS; anonymous GET 401; denied origin 403
without CORS; synthetic invalid bearer GET 401. Runtime startup/native loading
and rejection paths passed; authenticated preference CRUD is not claimed.
Reproduce: node qa/reminders/verify-preference-service.mjs. No real session was
read and no email sent. The normal website control remains unmounted.

Advisor: three INFO rls_enabled_no_policy notices intentionally correspond to
backend-only tables without browser grants; existing leaked-password warning
unchanged. References remain in the earlier evidence above.
The user requested moving next to Brevo sender implementation, not repeating
preference scaffolding. Authorized test recipient/sender are pending.
Activation project checks: 162 Node tests and 142 Vitest tests passed; Astro
check 293 files with zero errors/warnings/hints; static build 94 pages in 7.86s,
Complete. No site push/deployment or email was performed during activation.

## Gated actual-page binding — 2026-10-25

The wishlist route now composes a consent bootstrap through a presentation slot
when `PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED=1`. Default/hosting/ignored local
flags stay off; scheduler, unsubscribe and final wording are release gates.
The bootstrap requires enabled Auth/profiles/locale integration, derives the
preference endpoint from that Auth project and uses the shared minimal verified
account state. No extra client getUser or stored bearer/consent is added.
Repeated same-account events do not reread or reset the form. The checkbox is
unchecked when no confirmed preference exists; only explicit Save writes.

Five bridge tests plus sixteen existing preference data/client tests passed.
Full suite: 240 Node tests and 18 Vitest files / 152 tests passed. Astro check:
346 files, 0 errors/warnings/hints. Normal build: 94 pages in 11.97s; a generated
HTML assertion confirmed both consent and locale UI remain off by default.

Four actual-page Chrome cases passed (IT/EN, 375/1440px) against synthetic SDK/API
responses. Each measured one initial client Auth verification, one preference
read, three consent HTTP writes for two distinct commands (grant, same-ID retry
after lost acknowledgement, withdrawal), one explicit language write, and home
after logout. Restoring/account rendering caused no consent write. Withdrawal
preserved the explicit correspondence locale. No real consent or mail was made.
Results: preferences-auth-browser-results.json. Images stay ignored in
qa/auth/screenshots/preferences-auth-*.png. Reproduce:

```powershell
node qa/reminders/build-preferences-auth-preview.mjs
node scripts/serve-static-qa.mjs .astro/reminder-preferences-auth 4336
# Separate terminal, existing PLAYWRIGHT_MODULE and QA_BROWSER paths configured:
$env:QA_ORIGIN='http://127.0.0.1:4336'
$env:QA_REMINDER_OPT_IN='1'
node qa/auth/locale-auth-browser.mjs
```

This source wiring supersedes earlier unbound-source notes, not the live gate:
real authenticated preference CRUD through the deployed endpoint remains a user
integration check. The consent service is deployed at version 2; older version-1
activation results above are historical evidence, not current metadata.
