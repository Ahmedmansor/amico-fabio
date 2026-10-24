# Reminder preference storage — applied 2026-10-24

The user separately authorized these two tables, their grants and atomic RPC,
plus disposable role tests. schema.sql was applied to fabioEgypt
(iiivnvwspoikfrlclhyr). Do not rerun it. No sending or Cron was activated.

- wishlist_email_preferences stores current per-account consent, locale,
  wording version and server timestamps. enabled_since changes only on a
  disabled-to-enabled transition.
- wishlist_email_consent_events is append-only to the backend role, with
  per-account request IDs. No copied names or email addresses are stored.
- Both tables have RLS enabled, no browser policies and no anon/authenticated
  grants. The trusted service role has SELECT/INSERT/UPDATE on preferences and
  SELECT/INSERT on the audit table.
- change_wishlist_email_preference is SECURITY INVOKER with empty search_path
  and service-only EXECUTE. It atomically writes state and audit, serializes
  decisions per account and rejects conflicting request IDs. An old retry
  cannot restore consent after withdrawal. No Auth trigger was added.

role-tests.sql passed against PostgreSQL using two synthetic Auth UUIDs with
no emails, then ROLLBACK. Tests cover duplicate/conflicting requests, stable
consent start, stale-copy rejection, old grants after withdrawal, account-scoped
request IDs, browser/anonymous denial, audit UPDATE denial and account cascades.
Follow-up verification found zero preference and audit rows. See
../../qa/reminders/PREFERENCES.md for actual evidence and remaining gates.

The backend adapter and HTTP controller remain unbound. There is no deployed
endpoint or website opt-in. Verified identity, runtime limits, trusted secret
storage, unsubscribe integration and deployment approval are still required.
Final wording and retention/export/suppression decisions remain launch gates.
Never expose privileged credentials through public Astro configuration.

## Proposed distributed preference request limits — NOT APPLIED

rate-limit-schema.sql proposes wishlist_preference_rate_limits and the
service-only SECURITY INVOKER consume_wishlist_preference_limit RPC. Rows are
per account/operation with trusted server time and counters, RLS enabled, no
browser grants/policies, and Auth-deletion cascade. Per-account/operation
transaction locking serializes independent Edge instances; denied requests do
not increase the count. Expired windows reset on the next request, so no Cron
cleanup is required and storage is bounded to two rows per existing account.

rate-limit-role-tests.sql uses two synthetic Auth UUIDs without email, checks
threshold/deny/retry-after/reset, account/operation independence, invalid input,
anonymous/authenticated denial and cascade, then ROLLBACK. It has NOT run or
been parsed by PostgreSQL. Its small thresholds are tests, not deployment policy.
Both new remote schema execution and disposable writes need separate approval.
Do not infer their approval from the earlier consent table activation.

The prepared Edge service and proposed settings are in
../functions/wishlist-email-preferences/README.md. No function is deployed.
