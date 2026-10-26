# Auth Sending Path Protection — Magic Link & Abuse Mitigation

Step 2 of Section 7.1 and 7.2 (`PLAN.md`).

## Purpose

Enforces email validation, known disposable domain blocking, DNS verification, and multi-tier rate limiting on the **real Supabase Auth sending path**, preventing attackers or scripts from bypassing frontend validation by issuing direct requests to the Supabase Auth endpoint (`/auth/v1/otp`).

## Why Frontend-Only Validation Is Insufficient

1. **Bypassable Client UI:** Anyone with the public publishable key can send a direct `POST` to `https://<project-ref>.supabase.co/auth/v1/otp` with arbitrary payloads.
2. **Existing User Coverage:** The `before_user_created` hook only fires when a new row is inserted into `auth.users`. When an existing user requests a magic link to log in, `before_user_created` is **never triggered**.
3. **Brevo Quota Protection:** The project uses Brevo for transactional email (300 daily emails). Rapid resends or distributed bot spam to nonexistent or temporary mailboxes would quickly exhaust the daily allowance if protected only per individual email.

## Architectural Components

### 1. Send Email Hook & Real Brevo Dispatch (`supabase/functions/auth-send-email/`)
- **Crucial Supabase Contract:** When `Send Email Hook` is enabled, Supabase **replaces** its built-in SMTP engine. If a hook merely returns `{}` without sending an email, Supabase treats the request as successful and **no email is ever sent via SMTP**.
- **Edge Function Implementation:**
  - Validates syntax, RFC structure, and whitespace via `validateEmailAddress`.
  - Rejects known disposable domains (`public.disposable_email_domains`) with HTTP `403`.
  - Performs live DNS MX resolution via DoH (with RFC 5321 fallback to A/AAAA records).
  - Enforces global and per-email rate limits via `public.check_and_consume_auth_rate_limit`.
  - Renders responsive Italian or English email templates matching Fabio Egypt branding.
  - **Dispatches the email directly to Brevo REST API** (`POST https://api.brevo.com/v3/smtp/email`).
  - Returns HTTP `200 {}` to Supabase only when Brevo confirms acceptance (HTTP `201`).

### 2. Early Signup Rejection Hook (`public.hook_before_user_created`)
- **Hook Type:** `Before User Created` (PostgreSQL function).
- **Execution:** Runs before user insertion into `auth.users`. Unlike the Send Email Hook, this hook is a pure gatekeeper and does not replace SMTP.
- **Enforcement:** Rejects disposable domains and malformed addresses with HTTP `403` / `400` before user creation.

### 3. Multi-Tier Rate Limiting (`public.check_and_consume_auth_rate_limit`)
- **Global Rate Limiting (`public.auth_global_rate_limits`):** Enforces an hourly cap across all requests (e.g., 30 emails/hour), preventing attackers from rotating through different email addresses to exhaust the shared 300 Brevo daily allowance.
- **Per-Email Cooldown & Limit (`public.auth_email_rate_limits`):** Enforces a minimum 60-second cooldown between resends and a 5-email hourly limit per recipient, using anonymized SHA-256 hashes (`extensions.digest`).

### 4. Maintainable Disposable Domains Catalog (`public.disposable_email_domains`)
- Pre-seeded with over 40 well-known disposable/temporary email providers.
- Supports exact domain and wildcard subdomain matching (`*.mailinator.com`).
- **Strict Whitelist Protection:** Legitimate Italian providers (`libero.it`, `virgilio.it`, `alice.it`, `tin.it`, `tim.it`, `tiscali.it`, `fastwebnet.it`, `poste.it`, `postecert.it`), common webmail providers, and private/corporate domains are strictly preserved.

### 5. Role Isolation & Security Definer
- Tables: RLS enabled; revoked from `public`, `anon`, and `authenticated`; granted exclusively to `supabase_auth_admin` and `service_role`.
- Functions: `SET search_path = ''` with fully qualified `extensions.digest(...)` calls. Granted to `supabase_auth_admin` and `service_role`; revoked from client roles (`FROM authenticated, anon, public`).

## Verification & Role Assertions (`role-tests.sql`)

The accompanying `role-tests.sql` file performs transactional assertions with `ROLLBACK`:
- **Role `anon`:** Asserts `insufficient_privilege` for all protection tables and functions.
- **Role `authenticated`:** Asserts `insufficient_privilege` for all protection tables and functions.
- **Role `service_role`:**
  - Verifies acceptance of all Italian providers and private brand domains.
  - Verifies rejection of disposable domains and malformed addresses.
  - Verifies per-email cooldown enforcement.
  - Verifies global capacity cap enforcement.
- **Role `supabase_auth_admin`:**
  - Verifies `hook_before_user_created` behavior.

## Dashboard Activation Steps (Upon Approval)

1. Review and apply `schema.sql` via Supabase SQL Editor.
2. Run `role-tests.sql` to verify role assertions (rolls back automatically).
3. Deploy the Edge Function:
   ```bash
   supabase functions deploy auth-send-email --no-verify-jwt
   ```
4. In Supabase Dashboard, navigate to **Authentication > Hooks**:
   - Under **Send Email Hook**: Configure HTTP Hook pointing to `https://<project-ref>.supabase.co/functions/v1/auth-send-email`.
   - Under **Before User Created**: Select `Postgres Function`, choose `public.hook_before_user_created`.
5. Save configurations.
