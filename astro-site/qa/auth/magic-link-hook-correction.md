# Magic Link hook correction — 2026-10-26

Local implementation only; no remote writes, provider settings, deployment or
external email sending occurred in this task.

Implemented: mandatory Standard Webhooks HMAC; localized static callback with
fragment token; required durable admission/settlement; separate hourly and UTC-day
quota proposal; maintained SQL disposable catalog on every sending reservation;
IPv6 fallback and retryable DNS errors; bounded provider fetch/body and generic
failure responses. Existing email design, Google and reminder sending are preserved.

Real local command output:

```text
npm test
ℹ tests 365
ℹ pass 365
ℹ fail 0
Test Files 23 passed (23)
Tests 195 passed (195)

npx astro check
Result (420 files):
- 0 errors
- 0 warnings
- 0 hints

npm run build
[fabio-catalog-validation] Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings.
[fabio-seo] Verified canonical and reciprocal hreflang for 90 indexable pages; generated sitemap.xml and robots.txt.
[build] 96 page(s) built in 11.99s
[build] Complete!
```

The build used read-only public catalog access. It emitted the existing stale
Browserslist data notice; no dependency/version update was performed.

HTTP tests use synthetic signatures/credentials, Request/Response and the real
HTTP/dispatch code. Coverage includes tampering/time windows, body bounds,
signup/sign-in route language, exact redirects, callback parser compatibility,
concurrent requests, accepted replay, uncertain/quarantined outcomes, explicit
provider rejection and RPC timeout/invalid responses. Node also imports the
actual disabled Edge entry with a synthetic Deno surface; this is not native
Deno verification. DNS tests cover IPv6-only and transient fallback failures.

Not verified: native Deno packaging, Postgres role/transaction/concurrency tests,
deployed latency, real Supabase hook invocation, new/existing-user cross-browser
inbox receipt and used/expired links. Deno, psql and Docker are unavailable here.
The SQL tests remain review artifacts, not passing execution evidence.

Activation stays disabled with no daily allocation. Follow the hook runbook,
allocate the shared provider capacity and obtain the separate external activation
authorization before applying SQL/settings/deployment or sending test messages.
