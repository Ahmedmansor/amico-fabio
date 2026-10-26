# Auth Sending Path Protection — Magic Link & Abuse Mitigation

Step 2 of Section 7.1 and 7.2 (`PLAN.md`).

## Purpose

Enforces email validation, known disposable domain blocking, and rate limiting on the **real Supabase Auth sending path**, preventing attackers or scripts from bypassing frontend validation by issuing direct requests to the Supabase Auth endpoint (`/auth/v1/otp`).

## Why Frontend-Only Validation Is Insufficient

1. **Bypassable Client UI:** Anyone with the public publishable key can send a direct `POST` to `https://<project-ref>.supabase.co/auth/v1/otp` with arbitrary payloads.
2. **Existing User Coverage:** The `before_user_created` hook only fires when a new row is inserted into `auth.users`. When an existing user requests a magic link to log in, `before_user_created` is **never triggered**.
3. **Brevo Quota Protection:** The project uses a custom SMTP configuration with Brevo (300 daily emails). Rapid resends or automated bot spam to nonexistent or temporary mailboxes would quickly exhaust the daily allowance.

## Architectural Solution

### 1. Send Email Auth Hook (`public.hook_auth_send_email`)
- Hook Type: `Send Email` (PostgreSQL function or HTTPS).
- **Execution:** Runs whenever Supabase Auth is about to dispatch an email (`signup`, `magiclink`, `recovery`, `email_change`).
- **Enforcement:**
  - Validates email syntax, length, and structure.
  - Rejects known disposable domains (`public.disposable_email_domains`) with HTTP `403`.
  - Enforces per-email cooldown (60 seconds) and hourly sliding window caps (maximum 5 emails per hour per address) via `public.auth_email_rate_limits`, returning HTTP `429`.
  - Returning an error stops Supabase from dispatching the email via SMTP/Brevo.

### 2. Early Signup Rejection Hook (`public.hook_before_user_created`)
- Hook Type: `Before User Created`.
- Runs before user insertion into `auth.users`, ensuring temporary/disposable accounts are rejected before creating a database user record.

### 3. Maintainable Disposable Domains Catalog (`public.disposable_email_domains`)
- Pre-seeded with over 40 well-known disposable/temporary email providers.
- Maintainable and extensible without redeploying application code.
- **Strict Whitelist Protection:** Legitimate Italian providers (`libero.it`, `virgilio.it`, `alice.it`, `tin.it`, `tim.it`, `tiscali.it`, `fastwebnet.it`, `poste.it`), common webmail providers, and private/corporate domains are strictly preserved.

### 4. Important Realities & Limitations
- **No Guarantee of Mailbox Existence:** Syntax and domain checks cannot verify whether an individual mailbox exists without attempting delivery.
- **Control Proven by Magic Link Click:** Clicking the received magic link is the cryptographic proof of mailbox control.
- **DNS Resilience:** Temporary network or DNS lookup failures are treated as retryable conditions rather than permanent rejections.

## Dashboard Activation Steps (Upon Approval)

1. Review and apply `schema.sql` via Supabase SQL Editor.
2. Run `role-tests.sql` to verify assertions (rolls back automatically).
3. In Supabase Dashboard, navigate to **Authentication > Hooks (Beta)**:
   - Under **Send Email Hook**: Select `Postgres Function`, choose `public.hook_auth_send_email`.
   - Under **Before User Created**: Select `Postgres Function`, choose `public.hook_before_user_created`.
4. Save configurations.
