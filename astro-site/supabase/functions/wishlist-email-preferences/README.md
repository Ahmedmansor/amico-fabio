# Wishlist email preference Edge service — local review only

No function has been deployed. configuration.json has enabled=false and the
entry fails closed without reading keys. Astro remains output: static; this
separate Supabase function does not add Astro API routes or server hosting.

## Prepared behavior

- GET reads preference without enrolling an absent user; PATCH changes explicit
  consent through the already applied atomic state/audit RPC.
- Every request uses remote Auth getUser. Browser user IDs, recipients and audit
  timestamps are never trusted. Auth throttling/outage returns unavailable,
  rather than incorrectly reporting a logged-out account.
- Public Auth and privileged data clients are separate, have persistence/refresh
  disabled, and never reuse caller Authorization as the backend credential.
- Distributed counters are proposed in ../../reminder-preferences/rate-limit-schema.sql.
  The service fails closed if the limiter is unavailable. No memory fallback.
- Incoming JSON has size and body-read deadlines; Auth and database calls have
  deadlines including their response bodies, bounded responses and no redirects.
- Explicit origins, no-store responses, retry-after on 429, no raw provider/token
  logging. Missing/invalid settings fail closed. CORS is not authentication.

## Reviewable proposed settings

configuration.json is versioned nonsecret configuration, not an approved policy.
Proposal for the first local-site integration: allow http://127.0.0.1:4322 only,
30 reads / 60 seconds and 10 writes / 60 seconds per verified account, 4096-byte
incoming body, 65536-byte upstream response, 10-second network deadline and
5-second incoming-body deadline. These are preference endpoint limits only,
not Auth email/Brevo quotas. Environment overrides are parsed with no silent
quota defaults. No hosting environment has been changed.

After separate approval, set enabled=true/status to approved before preparing
the upload. The entry reads only server-injected SUPABASE_URL and the default
entries of SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS. Never ask for,
print, copy or commit their values. No legacy key fallback is added. If the
built-in modern key bindings are unavailable, stop and ask the user to confirm
server configuration without sharing values.

## Package and activation gates

From astro-site:

    node qa/reminders/prepare-preference-function.mjs

This produces an ignored proposed-upload.json and digest manifest under
.astro/reminder-preferences-function/. It reads 13 explicitly listed source/
configuration files and verifies relative import completeness. No upload occurs.
The Deno import map uses the already approved supabase-js@2.118.0; no dependency
was installed or version changed.

The proposed MCP upload uses verify_jwt=false because the function explicitly
validates the user bearer token through Auth on every data request. It never
accepts a publishable key as a user credential. This follows the documented
new-key Edge pattern; the service does not rely on CORS or locally decoded JWTs.
Separate deployment approval must cover this explicit authentication mode.

Before any remote activation: approve the counter SQL, disposable tests,
endpoint settings and deployment. Recheck metadata/function name to avoid
replacing an existing endpoint. Apply approved counter schema, run approved
role tests with ROLLBACK, inspect grants/RLS/advisors and verify clean fixtures.
The new counter SQL has NOT been executed/parsed by PostgreSQL. The earlier
consent tables are already applied; do not rerun their schema.sql.

Deno/CLI are not installed locally. Node synthetic tests exercise the actual
pinned SDK and composed handler, including a mock Deno disabled-entry guard;
they do not establish native Edge compatibility or live HTTP security.
Deployment compilation and live unauthenticated/preflight/error smoke checks
remain required, followed by an authorized signed-in integration test. No real
user token should be extracted by the agent. Gateway/IP protection before Auth
verification and project-wide budgets remain launch review items; per-account
counters do not prove complete abuse protection.

Mounting the component, final wording approval, browser Auth binding and real
account tests remain separate. No email, unsubscribe-token service, sender,
queue, Cron or Brevo setting is implemented/activated by this entry.

References:
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
- https://supabase.com/docs/reference/javascript/auth-getuser
