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
function is now deployed as version 2 on fabioEgypt.

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
verified authenticated backend flow. The subsequent real summary was accepted
at 15:37 UTC, recorded Delivered in Brevo, and found by the user in Gmail's
Promotions tab. The user confirmed that its tours/packages were their favorites.

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
  were not independently inspected. The initial deployment smoke checks did
  not dispatch email; the later authenticated test was confirmed by the user.
- Pushing the authorized branch also triggered a Preview deployment in the
  separate Vercel project amico-fabio. Vercel labels it Preview and assigns no
  custom domain; its production domain and main branch were not changed.

The original job window has expired after a successful real summary test.
A new external test needs an authorized fresh job; do not replay unknown
provider outcomes before reconciliation. Authenticated on-demand delivery is
confirmed for that test. Optional reminder scheduling, queue/ledger,
suppression/unsubscribe remain unverified.

## First authenticated attempt and correction — 2026-10-24

The user reported no received email and the UI showed an unknown outcome.
At 15:28:40 UTC the function returned HTTP 503. Targeted sanitized gateway logs
showed Auth getUser 200, Auth Admin recipient lookup 200, then GET wishlists
403. Metadata-only privilege checks confirmed service_role had no SELECT on
either wishlist table. The sender stopped at the incomplete favorites read,
before calling Brevo; this was not an ambiguous provider acceptance.

The correction keeps current table grants and RLS. The admin client handles
only verified recipient lookup. After caller verification, a fresh per-request
publishable client receives that request's bearer through accessToken and reads
both wishlist tables under the account's existing ownership RLS. No bearer is
logged, stored, or shared across requests. Known blocked/rejected responses now
display failure; genuinely uncertain responses remain unknown.

Verification: 20 targeted Node tests passed, including real SDK header/ownership
filters on both tables, per-request bearer isolation, rejected identities and
known failure versus unknown UI outcomes. Astro check reported 312 files,
0 errors/warnings/hints. Static build completed with 94 pages in 6.35s.
Function version 2 deployed with the original delivery ID and expiry, hash
23f3be8b15c8a127e5aca8a0e910212b03a1471b4648c750fdaca95619485fbb.
Live OPTIONS returned 204 and anonymous POST returned 401. The authenticated
retry returned HTTP 200 at 15:37:38 UTC. The user provided the matching Brevo
Sent/Delivered rows and then confirmed finding the correct favorites email in
Gmail Promotions. This verifies the requested summary, not automatic reminders.

## WhatsApp booking actions — local template update

The user requested a clear booking/contact action in the received email.
Local IT/EN HTML and plain-text templates now include a general WhatsApp action
before the cards and after the complete list. Each tour/package also has a
booking action with that item's exact localized title and URL in its draft
WhatsApp message. The general message stays short independently of list size.
All numbers come from shared/config/site.ts; no new contact number, availability
claim, discount or confirmed reservation is introduced. Website details and the
full wishlist remain secondary links. Opening a link never sends a WhatsApp
message automatically.

Checks: 8 Node tests and 8 domain Vitest tests passed. Astro check: 312 files,
0 errors/warnings/hints. Noindex test build: 94 pages in 10.19s. Eight browser
cases passed (IT/EN summary/reminder at 375/1440px), each with four sample cards,
six WhatsApp actions, 44px-or-larger buttons, loaded images, no overflow and no
page errors. The test inspects links without opening WhatsApp. Initial local
browser connection timed out because the preview server ran inside the sandbox;
restarting only that isolated server outside it made all cases pass.
Rendering all 36 published catalog items produced 63,494 HTML bytes in Italian
and 62,414 in English before provider rewriting; no card cap was introduced.
The source package now includes 29 files and was prepared disabled for review.
No updated function/site deployment or second email occurred for this change.
The local sample preview is http://127.0.0.1:4333/email-preview/summary-en.html
(Italian: summary-it.html); its four public catalog examples are not the user's
private favorites. Screenshot files remain local and ignored.
