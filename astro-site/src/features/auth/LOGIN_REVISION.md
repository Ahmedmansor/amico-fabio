# Login revision — approved 2026-10-28

This is the current execution target supplied by the user, superseding the older
Google/Magic-Link-only and login-dialog target in PLAN.md. Historical verification
there remains evidence for the old artifact only. Work stays on the migration
branch, in the static Astro application; production/legacy remain unchanged.

## Target and execution order

1. Preserve Google, session/profile, account-owned tour/package favorites,
   language updates, withdrawal and lossless guest merge. Move guest sign-in to
   `/it/login/` and `/en/login/`; `/login/` is the Italian entry alias. Header and
   wishlist entries navigate there with a validated return path. Retain the
   signed-in account dialog and signout; remove the guest login popup.
2. Add gated password sign-in and signup alongside Google. Microsoft/Azure was deferred by the user later on 2026-10-28 and is outside the current feature.
   Existing passwordless accounts use Google/Magic Link; they do not acquire a
   password merely by signing in. Provide an authenticated password-setting path
   before claiming those accounts can return using a password. Never overwrite
   an existing account through signup or disclose whether an address exists.
3. Gate signup and Magic Link before SDK calls: syntax, explicit known typo
   blocking with a user-applied correction, confirmed disposable-domain blocking,
   then a fresh Turnstile token. Password login also passes CAPTCHA when native
   Supabase CAPTCHA is enabled. Preserve private/Italian domains. Keep backend
   validation, DNS checks, quota, signing and replay protection on the real hook.
4. Extend the signed Send Email hook for signup confirmation as well as Magic
   Link with the same reservation/quota/redirect/replay checks. Confirmation
   callbacks keep token hashes in the fragment and explicit token consumption.
   Recovery uses an existing-account-only Magic Link, not automatic registration.
5. Implement the new optional promotional consent as a separate, default-false,
   auditable preference. A client `marketing_consent` metadata field is an intent,
   never authorization or durable proof of consent. Reconcile only after verified
   identity and confirmed writes; offer withdrawal and OAuth-account opt-in.
   Existing favorites-reminder consent does not authorize offers/discounts.
   No marketing dispatch, audience expansion or new campaign service is approved
   by the login revision. Keep restricted reminder sending unchanged. Do not
   silently rename the reminder checkbox to marketing consent.
6. Run domain/data/browser checks in both languages at mobile/desktop widths,
   Astro check and static build; inspect focused diffs and commit each task.
   Activate/redeploy the approved test project only after real keys/provider
   settings and backend gates match the new browser artifact.

## Corrections to the supplied sketch

- Verification proves mailbox control at that time, not permanent deliverability,
  zero hard bounces or detection of every disposable provider. DNS/CAPTCHA cannot
  guarantee mailbox existence or prevent all bots. Do not publish those promises.
- A normal password/OAuth login does not send a Brevo sign-in email. Initial
  confirmation, explicit resends and Magic Links consume allowance; never promise
  literally one lifetime email. Keep bounded retries and account recovery.
- Never wipe localStorage after login. Clear only confirmed synced items from the
  captured guest revision for the same current account; failures/signout/account
  changes preserve unsynced favorites, including old tour records.
- Reuse the existing pure typo/confirmed disposable rules rather than shipping a
  second redundant list in every page. The 2026-10-27 decision against activating
  the offline bulk catalog remains in effect: this revision requests maintained
  filtering, but is not evidence that an unaudited wider list is accurate. Prepare
  a reviewed update process with explicit legitimate-provider exceptions and
  false-positive rollback before changing effective backend blocks.
- New login-only validation/Turnstile UI loads only on login. Session restoration
  and wishlist scripts still run where required; do not promise zero Auth JS on
  catalog pages with working account favorites.

## Owner setup / actual key blockers

- Cloudflare Managed Turnstile: allow `localhost`, `127.0.0.1` if used, and the
  actual `amico-fabio-iyzo.vercel.app` test hostname (project `amico-fabio-test`). Production hostname can be
  registered for later, but do not activate production. The site key is public;
  set it as `PUBLIC_AUTH_TURNSTILE_SITE_KEY`. The secret belongs only in Supabase
  Attack Protection; never paste/store it in source or public build variables.
- Do not enable native CAPTCHA on the current remote artifact before the new
  login token forwarding is deployed: otherwise existing email controls break.
- Microsoft/Azure is deferred; no Azure credentials or provider setup are required.
- Keep Confirm email ON. Configure native password policy and CAPTCHA/rates.
  PUBLIC_AUTH_PASSWORD_ENABLED requires matching provider/hook settings. Google remains usable. TURNSTILE_SITE_KEY is accepted as a local build-time alias for the public widget key.
- No client secret, Turnstile secret, service-role key or access token is needed
  in this chat. User configures secrets through provider dashboards/secure existing
  tooling. Real email tests use only the user's requested recipient.

## References checked 2026-10-28

- https://supabase.com/changelog (markdown endpoint unavailable to this session)
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-captcha
- https://supabase.com/docs/guides/auth/social-sign-in/auth-azure
- https://supabase.com/docs/guides/auth/auth-identity-linking

## Progress

Plan reconciled with repository evidence. New password/Google/CAPTCHA and
promotional consent are targets, not claims about the currently deployed flow.

The initial standalone login implementation passed
377 Node tests, 197 Vitest tests, Astro check (434 files, no diagnostics), static
build (99 pages), and four IT/EN mobile/desktop synthetic browser scenarios.
See `../../../qa/auth/LOGIN_REVISION.md` for evidence and remaining activation.
The existing hook already handles signup with reservation/replay protection;
only its confirmation wording and new callback allowlist deployment need updating.

The local optional promotional-consent feature and its separate SQL/rollback role
test proposal are also prepared. Current checks: 385 Node, 200 Vitest, Astro check
445 files without diagnostics, static build 99 pages; four marketing and four
login synthetic browser scenarios pass. SQL has NOT been applied or role-tested;
PUBLIC_MARKETING_CONSENT_ENABLED stays off. See `../../../qa/auth/MARKETING_CONSENT.md`.

Later same-day update: user deferred Microsoft/Azure; its provider flag, button
and SDK branch are removed. The user saved TURNSTILE_SITE_KEY in ignored local
.env.local and reported configuring the secret in Supabase Attack Protection.
The public site key is accepted through that build-time alias; local password
mode is enabled. At the user's request, the full checks above were not repeated
for these later edits. A synthetic remote signup check was rejected by automatic
approval review before execution; do not report it as a Supabase/CAPTCHA rejection.
No real signup/email/CAPTCHA completion has been verified in this update.

Signed-in page follow-up: show Your account / signed-in status, keep password
settings collapsed and explicitly optional, and load CAPTCHA only for a confirmed
guest. The account-dialog password link opens those settings by explicit choice.
One targeted browser check with a synthetic Google session passed: account title,
collapsed password field, explicit expansion and zero CAPTCHA loads. All Supabase
requests were intercepted; no email or real Auth request. Broad checks were not
repeated, following the user's instruction.

Turnstile hostname fix: the actual local widget allowed localhost but not
127.0.0.1, the hostname used by the local app. Added only 127.0.0.1 through the
Cloudflare API; a subsequent widget listing confirmed it is allowed. Existing
domains, Managed mode and other settings were preserved. No key rotation, Auth
request or email sending occurred. Real challenge completion remains a user check.
