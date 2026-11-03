# Marketing consent checkpoint — 2026-11-02

## Overlap gate passed after explicit approval

The user answered `كمل` to the concrete temporary-job approval question. A fresh
disposable account and a uniquely named pg_cron job were authorized. The actual
writer was observed in PgSleep with its advisory transaction lock granted.
The independent connector request waited 12.284765 seconds, then returned
`stale-revision-rejected` (40001 caught by the assertion). Final state: consent
true, revision 1, exactly one audit event. This is real overlapping native
transaction evidence, distinct from the earlier sequential check below.
See native-overlap-2026-11-02.json.

The one-shot writer performs self-unscheduling in its outer transaction and
catches inner writer failures so unscheduling can commit even on a failed write.
This refines the draft's separate early-commit description while preserving its
single-job/no-repeat intent. Cleanup also unschedules/cancels only the exact QA
job/backend and deletes only the exact UUID plus invalid-domain fixture email.
Read-back: users 7, onboarding 7, preference/intent/audit counts 0, matching jobs
0, matching backends 0. Historical cron run logs are retained; no active fixture
or job remains. An initial response-parser failure canceled/cleaned its first
fixture; the parser was checked read-only before the successful fresh run.

Focused logic checks: 17 Node tests and 2 Vitest tests passed. Astro check: 587
files, 0 errors/warnings/hints. `npm run build` with the activation flag: 103
static pages complete. Synthetic browser cases (IT/EN, 375/1440) passed signup
intent, fail/retry, explicit grant and withdrawal. One obsolete CAPTCHA fixture
lacked the current remove method; the fixture was fixed, no product code changed.
Native evidence does not claim a real user's browser/inbox test or any mailing.

The existing Vercel test project's PUBLIC_MARKETING_CONSENT_ENABLED is now 1
in Production and Preview only. Other flags, reminder scope, provider settings,
committed defaults and ignored local env files are unchanged. Matching rebuilt
public-artifact/guest-UI verification is recorded in qa/auth, not inferred from
the environment update alone. All checkpoints below are historical.

User authorized continuing backend activation, performance and test deployment.
Applied `schema.sql` as migration `account_marketing_consent` to fabioEgypt
(`iiivnvwspoikfrlclhyr`). No existing account backfill, reminder enrollment,
provider change, promotional sender or mail was introduced. Existing accounts
remain default-false; new checked email signup metadata is captured only as an
unverified intent. RPCs require actual confirmed identity and expected account.

Reviewed the existing Auth INSERT trigger (`handle_new_user_onboarding`) before
fixtures: it only creates account onboarding state. Baseline: 7 users, 7 onboarding
rows. Native role script verifies all three anonymous RPC denials, cross-account
read/write/activation denials, unverified denial, table/private-schema denial,
invalid notice/locale denial, one-time verified signup activation, metadata-edit
non-authorization, explicit opt-in, withdrawal, stale-revision rejection,
idempotency and explicit decline before late signup activation. Real output:
`marketing native role/verification/withdrawal/replay assertions passed; fixtures rolled back`.
The first extended test run failed because the fixture retained account C's JWT
while testing account A; restoring the intended JWT fixed the fixture. No schema
change was needed. Failed run and successful run left no fixture state.

Two client-dispatched native writes produced `winner` (3.010015s) and
`stale-revision-rejected` (.003367s), one revision and one audit event. This proves
stale-write exclusion but **does not prove overlapping transactions**. The
dedicated disposable user was deleted by its exact ID plus exact invalid-domain
fixture email. Read-back: users 7, onboarding 7, preferences 0, intents 0, audit 0.

Automatic approval review rejected a temporary pg_cron concurrency fixture:
it would add privileged server automation and committed Auth/consent writes
beyond the approved rollback/concurrency scope. It was not retried or bypassed;
no job was created. The subsequent reader confirmed no matching active backend.
Public feature flag remains off until real overlapping transaction verification
is available through an authorized two-session mechanism or explicit approval
for the rejected temporary job. Synthetic tests are not native overlap evidence.

Security advisor emitted INFO for RLS-enabled/no-policy marketing tables. This is
intentional: direct browser grants are revoked, all access is through identity-
checking RPCs. No new permissive policies were added. An existing Auth leaked-
password-protection advisory is unrelated and was not changed.

Rollback: disable public flag/rebuild first; disable only the capture trigger if
signup is affected; revoke authenticated EXECUTE on the three marketing RPCs.
Preserve consent/audit evidence, do not restore withdrawn opt-ins, do not drop
tables. Existing account access and reminder scope are independent.
