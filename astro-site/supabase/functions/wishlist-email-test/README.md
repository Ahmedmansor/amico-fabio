# Restricted wishlist email test — not deployed

This entry exercises the real Brevo REST sender and local IT/EN template with
all available favorites of the authenticated, authorized account. It is a
requested summary, not automatic reminder enrollment or a scheduled campaign.

- One recipient and one Auth UUID are fixed in an ignored job configuration.
- Remote getUser verifies the caller; the account source rechecks the same Auth
  ID, confirmed email and recipient allowlist through Auth Admin. Favorites are
  read through wishlist/data/createAccountRepository, never through a duplicate
  provider implementation. No recipient, favorite IDs, subject or HTML comes
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
private recipient/UUID are not committed. An actual job goes only in ignored
.astro/reminder-email-test-job.json, with keys matching configuration.example.json.
Use a new delivery UUID, createdAt=activation time and expiresAt=createdAt+20min;
never reuse an expired job as a new message. Example config is disabled and
contains placeholders, not actual recipient data or an active job.

From astro-site:

    node qa/reminders/prepare-email-test-function.mjs
    node qa/reminders/prepare-email-test-function.mjs .astro/reminder-email-test-job.json

The first command creates a disabled review package. The second reads only the
named ignored nonsecret job file. Unknown keys (including credentials) are
rejected. Recursive relative imports are collected from explicit source roots;
28 files are currently packaged. No upload or email happens in the preparer.
Native Deno compilation remains a deployment check, not a local success claim.

## Remaining authorized-test steps

The existing test alias https://amico-fabio-iyzo.vercel.app returned 404 for
/tours-manifest.json and /en/wishlist/ during preflight. A separately approved
update of Vercel project amico-fabio-test is needed before real sending, so mail
images/links resolve. Do not change legacy main/fabioegypt.com/amico-fabio.
Publish the static test build with noindex, validate its manifest and selected
page/image links, then deploy this new function after explicit authorization.
The preference-function deployment approval does not silently cover this sender.

The local wishlist test button is behind PUBLIC_WISHLIST_EMAIL_TEST_ENABLED=0.
After approved activation, enable only the ignored local setting and the exact
Supabase /functions/v1/wishlist-email-test endpoint. Auth supplies its own bearer
internally; never extract or show the user's token. The signed-in owner presses
Send test email. UI distinguishes acceptance, unknown result and expiry, and
locks after one attempt per page load. Hosting/defaults remain disabled.

No Cron, delivery queue, durable mail ledger, daily allowance, bounce/complaint
webhooks, automatic-reminder sender or real unsubscribe is activated by this
test. Those remain required before launch. Email sign-in is still disabled.

References:
- https://developers.brevo.com/reference/send-transac-email
- https://developers.brevo.com/docs/heterogenous-versions-batch-emails
