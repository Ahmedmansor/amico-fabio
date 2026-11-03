# Wishlist correspondence capability Edge service — disabled local package

No deployment has occurred. Configuration stays disabled with **no default
ingress quota/window**. The user must review those operational values, token
lifetime/recovery and the unapplied SQL proposals before activation.

The entry composes bounded network access, one backend-only SDK client, the
distributed fixed management budget and scoped capability service. It does not
invoke Auth or send mail. All data operations require in-function capability
authentication even though eventual deployment uses `verify_jwt=false` for
no-login links. Disabling platform JWT verification alone is not authorization.

Prepare from astro-site:

```powershell
node qa/reminders/prepare-management-function.mjs
```

This reads 13 explicit source/config files and checks relative imports. Ignored
`.astro/management-function/` contains the proposed payload and digest manifest.
No environment file, credentials, upload or deployment is involved. The existing
approved SDK version is pinned in deno.json; no dependency was installed.

Order for a future separately approved activation:
1. Review/apply correspondence-policy, token and ingress proposals; run authorized
   disposable/native role, concurrency and rollback-cleanup checks.
2. Approve global ingress capacity/window. Every admitted POST uses the same
   singleton, including bad tokens. It is shared capacity, not a per-user quota.
3. Approve token lifetime/recovery/rotation/retention and verify gateway protection,
   Brevo management-link tracking/fragment behavior and immutable-job link storage.
4. Enable reviewed config, deploy this function, check native startup/CORS/rate/
   invalid/expired/revoked token behavior, then a scoped user integration check.
5. Only then enable the browser management flag. Opt-in, queue/Cron and actual
   sending have their separate unfinished delivery gates.

Current tests are Node composition with real SDK/synthetic HTTP, not native Deno
or live SQL verification. No actual token or user session was extracted.
