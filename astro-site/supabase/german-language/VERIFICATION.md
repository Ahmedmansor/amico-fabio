# German account language verification — 2026-11-03

The user explicitly approved extending the existing Supabase account/email
language support after automatic review initially rejected remote execution.
Migration `support_german_site_and_account_language` returned `success: true`.
The eight existing locale constraints and eight function allowlists add `de`.
No policy/grant, consent logic, recipient scope, schedule or budget is changed.
`rollback.sql` contains the exact captured pre-change definitions.

Readback of all eight functions confirmed German support and byte-identical
ACLs to the pre-change snapshot. Native role execution returned:

> DE/PT locale, stale update, consent timing, withdrawal, verified signup and role isolation assertions passed; ROLLBACK completed.

The test used two generated `example.invalid` accounts, with no mail API.
Baseline/final: Auth users 7, profiles 6, reminder preferences 4, marketing
preferences 0, reminder jobs 1; remaining `qa-i18n-…@example.invalid` users 0.

Five deployment payloads start from the downloaded active functions and overlay
only the shared language configuration, translated Auth mail module or reminder
dictionary modules as required. Existing remote security-code differences,
`verify_jwt` configuration, dependency pins and configuration.json bytes remain
unchanged. All five exact payloads passed native Deno checking.

Initial activated versions: auth-send-email 9, account-locale 5,
wishlist-email-preferences 7, wishlist-email-management 4. Reminder dispatch is
coordinated with the new hosted catalog rather than requiring German from the
previous four-language catalog. Final deployment/readback evidence follows.

The pre-change security advisors contained existing private-table/no-policy INFO
notices, role-specific consent RPC notices, an onboarding-trigger function
EXECUTE notice and leaked-password protection warning. These are pre-existing;
no permissions or Auth provider setting was changed by this language task.
Reference: https://supabase.com/docs/guides/database/database-linter
No signup, sign-in, reminder or promotional email was sent during verification.
