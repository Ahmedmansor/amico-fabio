# Brevo wishlist summary implementation — 2026-10-24

Implemented the actual provider POST transport, confirmed-account source, strict
public test catalog fetcher and local-template orchestration. HTML/text/styles
remain in the repository. All eligible saved tours/packages are included with
separate groups and the same published price. The body/recipient never come
from the browser; no reminder consent is created by a requested summary.

Backend source: reminders/data/brevo-delivery.ts, email-account-source.ts,
email-catalog-source.ts; presentation/send-wishlist-summary.ts composes them
with domain/email.ts and the existing renderer. presentation/summary-test-handler.ts
and supabase/functions/wishlist-email-test/ implement a restricted authenticated
one-job test with expiry and stable provider idempotency. The dedicated test
function is now deployed as version 1 on fabioEgypt.

The public test flag defaults off. The wishlist route composes SummaryEmailTest
through a named slot so wishlist does not depend on reminders (reminders already
uses wishlist's data/domain). Auth owns bearer retrieval for the captured account;
tokens are never displayed/logged or copied to new storage. UI feedback is IT/EN
and distinguishes accepted, expired, failed and unknown, with no automatic retry.

Actual checks:
- npm test: 180 Node tests passed, 0 failed; 17 Vitest files / 143 tests passed.
- npx astro check: 312 files, 0 errors, 0 warnings, 0 hints.
- Default static build: 94 pages in 5.76s, Complete.
- Mock-only UI build: 94 pages in 35.31s, Complete, noindex.
- Eight browser cases passed: IT/EN, 375/1440px, accepted/unknown outcomes;
  keyboard-triggered single request, no recipient/body injection, no automatic
  retry, no horizontal overflow or page errors. JSON is committed; screenshots
  are ignored. The initial fixture used the SDK's default storage key; it was
  corrected to the application's custom key. Cookie-banner dismissal is awaited
  before final screenshots. No product Auth storage key changed.
- prepare-email-test-function.mjs: 28 files packaged, disabled review artifact;
  no keys read, no upload, no email.

User authorized the test recipient/sender and reported adding BREVO_API_KEY in
Supabase Secrets. Only the authorized Auth identity/confirmation status was
looked up; no token/key was extracted. Direct administrative wishlist preview
was not completed; the real test intentionally loads favorites through the
verified authenticated backend flow. No real Brevo request/email has occurred.

Deployment activation, 2026-10-24:
- Vercel project amico-fabio-test deployed commit 70fbe40 to its Production
  environment. The stable test alias serves the schema-v1 test manifest (36
  items), both localized wishlist routes and a detail page with noindex; a
  catalog JPEG returned HTTP 200. The legacy GitHub Pages domain was untouched.
- Supabase function wishlist-email-test is ACTIVE version 1, ID
  9d386e74-962f-45a3-9c4e-b0b6509d9560, with its own Auth getUser checks
  (verify_jwt=false). Live checks returned OPTIONS 204 for the allowed local
  origin, anonymous POST 401 and disallowed-origin POST 403. These checks did
  not read favorites or send email.
- Ignored local astro-site/.env.local enables the wishlist test button and points
  to this function. The single-job window expires at 2026-10-24T15:44:56Z; it
  uses a private ignored config and a fresh delivery ID. The sender/key values
  were not independently inspected, and no actual Brevo request or inbox
  delivery is claimed.
- Pushing the authorized branch also triggered a Preview deployment in the
  separate Vercel project amico-fabio. Vercel labels it Preview and assigns no
  custom domain; its production domain and main branch were not changed.

The remaining user step is to restart the local Astro server on port 4322, sign
into the authorized account, open /en/wishlist/ or /it/wishlist/, and press the
explicit email-test button before the one-job window expires. This sends through
Brevo only after the authenticated backend reads the account favorites. If the
result is unknown, do not retry until Brevo is reconciled. Native Edge execution,
actual inbox delivery, sender verification, optional reminder scheduling,
queue/ledger/suppression/unsubscribe remain unverified.
