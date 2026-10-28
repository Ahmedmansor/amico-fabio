# Optional offers consent — local proposal, 2026-10-28

The latest user plan adds optional favorites offers/discounts consent. It is a
separate default-false permission; existing reminder consent is never reused.
No promotional mail sender or expanded recipient scope is included.

`schema.sql` is prepared locally, NOT applied. Keep
`PUBLIC_MARKETING_CONSENT_ENABLED=0` until schema review, native role/isolation
and concurrency assertions, signup confirmation, withdrawal and callback tests
pass. No production or hosting setting was changed. Apply only to the approved
test Supabase project as part of coordinated activation, after reviewing this
artifact and its rollback. The Auth signup trigger adds a dependency to signup:
test it before enabling it on the actual project.

Tables: public preferences (no direct browser grants); private signup intent and
audit history (no browser grants); RLS on all three. Explicit authenticated-only
RPCs validate auth.uid, expected account ID, actual auth.users confirmation and
notice version. They use a restricted search_path and qualified objects.
No profile/user_metadata claim authorizes writes. There is no access by anon.

An INSERT-only Auth trigger snapshots a new email signup's checked optional
intent and notice/locale. Subsequent editable metadata cannot create a grant.
The protected activation RPC consumes it once after real verification; it never
overwrites an existing preference. Google/Microsoft accounts default to false
and opt in explicitly from account settings. Revision checks and a shared
per-account transaction lock prevent stale opt-in overwriting withdrawal.
Same-value requests are idempotent. Client failures never imply confirmed consent.
The locale stored on the audit is the language of that consent notice. Any future
dispatch must use the account's latest supported site language from the existing
account-locale contract, not an independent marketing-language override.
Account deletion cascades preference, intent and audit rows; review any legal
retention exceptions in the existing administrative erasure process.

Activation tests must use disposable fixtures and ROLLBACK: anonymous RPC denied;
cross-account expected-ID denied; unverified write/activation denied; verified
signup intent activates exactly once; absent/edited metadata cannot grant;
withdrawal survives late activation and stale revision writes; same-value saves
add no audit event; direct table DML denied; concurrent opposite writes result
in one confirmed revision and one serialization conflict. Do not label local
synthetic TypeScript tests as these native SQL assertions.

Rollback: first disable the public flag and rebuild the test artifact. Disable
the capture trigger if signup is affected. Revoke authenticated EXECUTE on the
three RPCs. Preserve existing consent/withdrawal/audit evidence; do not drop
tables or restore old opt-in values as a rollback. Removing this feature does
not disable account access or the separate favorites reminder system.
