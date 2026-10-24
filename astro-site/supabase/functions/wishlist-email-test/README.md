# Restricted wishlist email test — deployed job expired, locale source prepared

This entry exercises the real Brevo REST sender and local IT/EN template with
all available favorites of the authenticated, authorized account. It is a
requested summary, not automatic reminder enrollment or a scheduled campaign.

- One recipient and one Auth UUID are fixed in an ignored job configuration.
- Remote getUser verifies the caller; the account source rechecks the same Auth
  ID, confirmed email and recipient allowlist through Auth Admin. Favorites are
  read through wishlist/data/createAccountRepository using a fresh per-request
  publishable client and the verified caller's bearer, so ownership RLS applies.
  The admin client never reads wishlist tables. No recipient, favorite IDs, subject or HTML comes
  from the browser request.
- Deployed v3 accepts an empty body and uses its configured English language.
  New local source also accepts only `{locale: 'it' | 'en'}` as JSON, capped at
  256 bytes with a deadline. It rejects recipient/owner/consent/job fields and
  unsupported languages. Empty streams retain legacy behavior. CORS is not Auth.
- One restricted job has one immutable language/key. A different request language
  returns 409 without contacting the sender. A fresh approved Italian job can
  test an Italian page; a language switch never creates another delivery.
- A fixed delivery UUID is sent as Brevo headers.idempotencyKey. The authorized
  job expires in 20 minutes, inside Brevo's documented 30-minute TTL. A dispatch
  guard rechecks the window immediately before the provider call. Expired jobs
  cannot restart on refresh/cold start. No automatic retry is performed.
- Acceptance requires HTTP 201 and a messageId. Duplicate/timeout/5xx/ambiguous
  responses remain unknown, not delivered. 429 is deferred. Reconcile provider
  state before retrying any unknown result. No inbox delivery is assumed.
- The manifest must be on the explicit HTTPS test origin, schema-valid, fresh
  and in the test environment. Missing/unpublished items are excluded; empty
  lists or incomplete reads never send. Current published pages/prices/images
  are the source of email content. No fallback to stale or production URLs.

## Secret and deployment state

User reported adding BREVO_API_KEY to Supabase Edge Function Secrets. Its value
was not requested/read/printed/committed. The function reads this binding and
modern Supabase bindings only inside the server runtime. No key appears in
browser configuration, template HTML, preview output or source packages.
No Brevo SDK/dependency was installed; the transport uses fetch to the fixed
https://api.brevo.com/v3/smtp/email endpoint. Sender must already be registered
and verified in Brevo; that has not been independently checked.

User authorized one test recipient and sender in the conversation, and then
explicitly approved a second test with the booking-action template. Their
private recipient/UUID are not committed. The fresh job is stored only in the
ignored .astro/reminder-email-test-job.json and expires at
2026-10-24T18:02:33Z. The deployed function is version 3, ID
9d386e74-962f-45a3-9c4e-b0b6509d9560. A new test after expiry requires a fresh
delivery UUID, activation timestamp, packaging and deployment; never reuse an
expired job as a new message. Example config stays disabled with placeholders.

From astro-site:

    node qa/reminders/prepare-email-test-function.mjs
    node qa/reminders/prepare-email-test-function.mjs .astro/reminder-email-test-job.json

The first command creates a disabled review package. The second reads only the
named ignored nonsecret job file. Unknown keys (including credentials) are
rejected. Recursive relative imports are collected from explicit source roots;
29 files are currently packaged, including the shared public contact config for
the local WhatsApp action update. No upload or email happens in the preparer.
Native Deno compilation remains a deployment check, not a local success claim.

## Deployment and user test

The user approved the update of Vercel project amico-fabio-test and deployment
of this function. Commit 70fbe40 is Ready in the test project's Production
environment. The stable alias https://amico-fabio-iyzo.vercel.app serves a
schema-v1 test manifest with 36 items; both wishlist routes and detail pages
return noindex, and the sampled image returned HTTP 200. Do not change legacy
main/fabioegypt.com or the existing project's production settings.

Live function checks: allowed-origin OPTIONS returned 204; anonymous POST
returned 401; disallowed-origin POST returned 403 without CORS permission. These
checks sent no email. The automated branch push also created a Vercel Preview in
the separate amico-fabio project; it has no custom domain and is not production.

The ignored local astro-site/.env.local sets
PUBLIC_WISHLIST_EMAIL_TEST_ENABLED=1 and the exact Supabase function endpoint.
For a future fresh authorized job, restart the local dev server at port 4322 so
Astro reads these settings, sign in
to the authorized account, open /en/wishlist/ or /it/wishlist/, then press the
explicit test button. Auth supplies its bearer internally; never extract or
show the user's token. UI distinguishes acceptance, unknown result and expiry,
and locks after one attempt per page load. Hosting defaults remain disabled.

The real version-2 summary was Delivered by Brevo and found in Gmail Promotions;
the user confirmed the favorites content. The initial job is now expired.
The later WhatsApp booking-action template is now deployed in version 3 for the
second user-authorized test, with a fresh delivery ID and window. Live startup
probes returned OPTIONS 204, anonymous POST 401 and unapproved-origin POST 403.
These checks sent no email. The user subsequently confirmed the new email and
correct per-item WhatsApp text/URL. The second window is now expired; do not renew
it or send another message without the required authorization.

## Page-language protocol — local continuation, 2026-10-25

`PUBLIC_WISHLIST_EMAIL_TEST_PAGE_LOCALE_ENABLED=0` preserves v3 compatibility:
empty body, existing preflight and configured-job language. The deployed endpoint
has not changed. Enable the new protocol only with its deployed handler and a
fresh approved job/window. Enabled clients send only page locale and require its
echo on acceptance; old/wrong-language acknowledgements remain unknown. A job in
another language has a distinct IT/EN UI message. A general requested-summary
service must bind each new job to validated request locale; this restricted test
is not that public service. Delayed reminders use stored correspondence locale.
The disabled 29-file package was prepared; no secrets, job renewal, upload,
deployment or external email occurred. See qa/reminders/BREVO.md for test results.

No Cron, delivery queue, durable mail ledger, daily allowance, bounce/complaint
webhooks, automatic-reminder sender or real unsubscribe is activated by this
test. Those remain required before launch. Email sign-in is still disabled.

References:
- https://developers.brevo.com/reference/send-transac-email
- https://developers.brevo.com/docs/heterogenous-versions-batch-emails
