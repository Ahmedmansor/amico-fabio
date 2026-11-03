# Local optional offers consent — 2026-10-28

This implements local UI/data/domain foundations from the revised plan. It is
disabled by default (`PUBLIC_MARKETING_CONSENT_ENABLED=0`) and not deployed.
`supabase/marketing-consent/schema.sql` and `role-tests.sql` are reviewed local
proposals, not executed SQL or evidence of native ownership/concurrency checks.

Email signup has an optional unchecked offers/discounts choice, only when this
separate flag is enabled. Auth carries its versioned intent. The proposed
INSERT-only Auth trigger snapshots that intent separately from editable
metadata. A protected RPC activates it once after real email verification, and
never overwrites an existing account choice. The callback attempts activation;
failure does not prevent sign-in and the account view retries the pending intent.
Google/Microsoft users opt in explicitly through the account/wishlist view.

Settings show the confirmed state, require verified identity and support explicit
withdrawal. Account changes invalidate late responses. Saves carry expected user
ID and revision. Failures remain unconfirmed until a successful read/retry. No
reminder permission, timing, audience, webhook or sender is changed. No promotional
sender, broader sends or claims of deliverability are added. Future dispatch must
use the account's latest site language and separately verified unsubscribe and
suppression handling.

Actual local results:

```
npm test
tests 385; pass 385; fail 0
Test Files 25 passed (25)
Tests 200 passed (200)

npx astro check
Result (445 files): 0 errors; 0 warnings; 0 hints

npm run build
output: static
99 page(s) built in 15.45s
Complete!
```

`marketing-browser.mjs` passed IT/EN at 375/1440px with synthetic Auth/RPC and
Turnstile responses. It verifies default unchecked signup, versioned intent-only
submission, editable metadata not granting consent, confirmed reads, failed save
and retry, explicit opt-in, withdrawal and zero reminder/email requests.
`login-browser.mjs` also passed all four scenarios after integration. Screenshots
are ignored/local in `qa/auth/screenshots/marketing-*`.

Use the isolated login fixture described in LOGIN_REVISION.md, additionally setting
PUBLIC_MARKETING_CONSENT_ENABLED=1. Every remote Auth/RPC/CAPTCHA request is mocked.
Run `node qa/auth/marketing-browser.mjs` with PLAYWRIGHT_MODULE and QA_BROWSER set.
These are browser/data tests, not native SQL, inbox or provider verification.

Remaining coordinated activation: native schema/role/concurrency checks, actual
Turnstile public site key and Supabase CAPTCHA secret/provider configuration,
Azure provider setup, confirmation/recovery tests, then matched test deployment.
Keep the feature off if any backend gate fails. Rollback is documented alongside
the SQL; preserve all consent/withdrawal evidence instead of deleting it.
