# Account locale Edge service — disabled local package

`configuration.json` has `enabled=false`; no function is deployed by preparing
these files. The [storage migration](../../account-locale/README.md) is already
applied/role-tested. No Astro API route, SSR or application server is introduced.

GET returns a coherent site/email-language/revision snapshot. PATCH changes only
an explicit locale command through the atomic private RPC. Every data request
remotely verifies the bearer with Auth; a separate private SDK client owns RPC
access. No browser ownership, email recipient, consent or timestamp is accepted.
Malformed input, origins, bodies, timeouts, Auth/rate-limit outages fail closed.
Conflicts return HTTP 409 plus the confirmed state; the client never auto-rebases.
Keepalive improves unload delivery but is not a persistence guarantee.

The entry composes existing verified-Auth, bounded-fetch and distributed-limiter
functions outside the feature graph. Auth never imports reminders; reminders can
continue using Auth without a cycle. The two endpoints intentionally share the
existing per-account preference read/write budget (30/10 each 60 seconds), rather
than multiplying allowed requests across endpoints. Config names are retained
for that shared policy. No extra email/Brevo quota is implied.

From `astro-site/`:

```powershell
node qa/auth/prepare-locale-function.mjs
```

This writes an ignored 13-file package/digest manifest under
`.astro/account-locale-function/`. It reads only an explicit source allowlist,
not local secrets or environment files; it does not upload. Deno's import map
uses the already approved SDK version 2.118.0 without a dependency installation.

Activation remains a separate operational step: review the target function name,
enable approved configuration, deploy with explicit in-function Auth verification
(`verify_jwt=false`), run native startup/preflight/no-auth/origin smoke checks,
then the authenticated user check. Do not extract a real user token. Modern
backend credentials are read only by the enabled server entry from built-in
runtime bindings; never print them or copy them to the browser. Actual overlapping
database-connection verification remains pending. Hosted Auth/domain changes,
Magic Link and email sending are outside this package.
