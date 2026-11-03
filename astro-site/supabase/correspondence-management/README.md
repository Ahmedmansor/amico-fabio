# No-login correspondence management — local implementation, not deployed

This is a separate capability from Auth. A random 256-bit token permits only
minimal preference read, withdrawal and explicit language save for its bound
account. It cannot grant consent, sign in or read favorites/profile/recipient.
Only SHA-256 digest is stored in a private RLS table. Public RPCs are INVOKER,
empty search path and service-only. The schema is not exposed through Data API;
the issuer uses a narrow public service-only RPC, not private-schema REST access.

`schema.sql` and `role-tests.sql` are **unexecuted proposals**. Apply the separately
reviewed correspondence-policy successor first. Native SQL parsing, role grants,
expiry/revocation, account isolation, concurrent changes, cascade/deadlock behavior
and rollback cleanup remain unverified. No schema or live endpoint was changed.

Static `/{it,en}/email-preferences/` pages are noindex, with local assets and no
Auth, analytics, cookies, trackers or external page scripts. Tokens use a fragment,
are removed from the address bar, remain in memory only, and travel to the
configured backend in a POST body with credentials omitted/no-referrer. Read
is nonmutating; only an explicit button changes state. A second fragment link
reloads to discard the prior capability. Email HTML/plain text use the resolved
email language for this page, including the Italian fallback.

The shared page supports explicit unsubscribe and language change, not RFC 8058
one-click headers/POST. That is a separate delivery requirement; do not advertise
one-click compliance from this page. The scoped token is intentionally reusable
for both actions until expiry/revocation; it is not a password-reset token.

## Activation gates

- Keep `PUBLIC_WISHLIST_EMAIL_MANAGEMENT_ENABLED=0` in normal/hosting settings.
- Review/apply both proposals and run approved disposable native tests. The
  prepared fixtures send no email and end in ROLLBACK.
- Source runtime now composes a database-backed global ingress gate, including
  invalid tokens, without IP/header identity assumptions. Its singleton storage
  cannot grow per visitor/token or reset when a caller forges a header. Review
  `rate-limit-schema.sql` and the unexecuted rollback role proposal. A global
  budget is shared by legitimate visitors too: capacity/window need approval.
  This is not a guarantee against Edge invocation costs or denial of service;
  review gateway/perimeter controls before public release.
- A mixed runtime policy fails closed rather than resetting the budget; changing
  policy requires a reviewed singleton reset. Native concurrent admission and
  lock/latency checks remain pending. No counter or endpoint is deployed.
- Disabled Edge composition/package now lives in
  `../functions/wishlist-email-management/`. Both ingress policy fields are
  intentionally blank, so merely flipping enabled cannot activate it.
- Choose token lifetime, expiry recovery/reissue, rotation and cleanup/retention.
  Issuer requires lifetime explicitly; test values are not operational choices.
  Normal valid-link withdrawal must work without a logged-in session.
- Issue from a trusted eligible dispatch job only, then retain its link securely
  with that immutable job for retries. Do not regenerate a new token/message
  after an uncertain provider outcome. Do not log token, body or complete URL.
- Inspect Brevo link rewriting/tracking, real inbox fragment preservation and
  management-link leakage before any real send. No tracking/settings changed.
- Finish durable queue/acceptance ledger, quotas, suppression and unsubscribe
  propagation before opt-in/Cron/public delivery activation.

References reviewed: [OWASP token handling](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
(general capability hygiene, not a password reset implementation),
[Supabase function privileges](https://supabase.com/docs/guides/database/functions).
