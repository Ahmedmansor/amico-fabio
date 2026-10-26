# auth-send-email — Supabase Auth Send Email Hook (Edge Function)

## Architectural Role

In Supabase Auth, when the **Send Email Hook** is enabled, Supabase **replaces** its built-in SMTP engine. The hook is responsible for validating and delivering the email. If a hook merely returns `{}` without dispatching the message, Supabase assumes success and **no email is ever delivered**.

This Edge Function provides the complete, secure implementation for the Send Email Hook:
1. **RFC & Syntax Validation:** Rejects malformed or overlong addresses.
2. **Disposable Domain Blocking:** Cross-checks against the maintained catalog (`disposable_email_domains`).
3. **Real DNS MX & Address Fallback:** Performs live DoH lookups for MX records (with RFC 5321 fallback to A/AAAA records). Rejects nonexistent domains (`NXDOMAIN`) while treating temporary DNS hiccups as retryable conditions.
4. **Global & Per-Email Rate Limiting:** Calls `public.check_and_consume_auth_rate_limit` in PostgreSQL to enforce both global capacity caps (preserving the shared 300-email daily Brevo budget) and per-email cooldowns (60s minimum) and hourly limits.
5. **Brand-Aligned Localization:** Renders responsive Italian or English magic link templates matching Fabio Egypt's design.
6. **Real Brevo REST API Delivery:** Dispatches the email directly via `POST https://api.brevo.com/v3/smtp/email` using `BREVO_API_KEY`.
7. **Accurate Error Mapping:** Propagates 400, 403, 429, or 503 status codes back to Supabase Auth so the user receives honest, localized feedback.

## Configuration Keys

- `enabled`: `boolean` (default `false`). Must be explicitly enabled when authorized.
- `senderEmail`: `string` (`info@fabioegypt.com`).
- `senderName`: `string` (`Fabio Egypt`).
- `timeoutMs`: `number` (network timeout).
- `defaultSiteUrl`: `string` (`https://fabioegypt.com`).

## Deployment Command (When Authorized)

```bash
supabase functions deploy auth-send-email --no-verify-jwt
```
