# Marketing consent checkpoint — 2026-11-02

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
