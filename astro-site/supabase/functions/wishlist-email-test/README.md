# Restricted wishlist email test — deployed for one authorized job

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
- The test body must be empty; empty POST streams are supported with a bounded
  read deadline. CORS alone is never authorization.
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

User authorized one test recipient and sender in the conversation. Their
private recipient/UUID are not committed. The active job is stored only in the
ignored .astro/reminder-email-test-job.json and expires at
2026-10-24T15:44:56Z. The deployed function is version 2, ID
9d386e74-962f-45a3-9c4e-b0b6509d9560. A new test after expiry requires a fresh
delivery UUID, activation timestamp, packaging and deployment; never reuse an
expired job as a new message. Example config stays disabled with placeholders.

From astro-site:

    node qa/reminders/prepare-email-test-function.mjs
    node qa/reminders/prepare-email-test-function.mjs .astro/reminder-email-test-job.json

The first command creates a disabled review package. The second reads only the
named ignored nonsecret job file. Unknown keys (including credentials) are
rejected. Recursive relative imports are collected from explicit source roots;
28 files are currently packaged. No upload or email happens in the preparer.
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
Restart the local dev server at port 4322 so Astro reads these settings, sign in
to the authorized account, open /en/wishlist/ or /it/wishlist/, then press the
explicit test button. Auth supplies its bearer internally; never extract or
show the user's token. UI distinguishes acceptance, unknown result and expiry,
and locks after one attempt per page load. Hosting defaults remain disabled.

No Cron, delivery queue, durable mail ledger, daily allowance, bounce/complaint
webhooks, automatic-reminder sender or real unsubscribe is activated by this
test. Those remain required before launch. Email sign-in is still disabled.

References:
- https://developers.brevo.com/reference/send-transac-email
- https://developers.brevo.com/docs/heterogenous-versions-batch-emails
