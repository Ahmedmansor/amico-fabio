# Actual verification — 2026-11-02

Applied migration `support_spanish_and_european_portuguese_site_languages`
on fabioEgypt (`iiivnvwspoikfrlclhyr`); tool returned `success: true`.
Readback confirmed all eight reviewed locale constraints accept IT/EN/ES/PT.
Readback of all eight function ACLs matched the pre-change snapshots exactly.
No policies, grants, recipients, schedules, budgets or consent states were changed.

`role-tests.sql` executed successfully with the native database roles:

> ES/PT locale, stale update, consent timing, withdrawal, verified signup and role isolation assertions passed; ROLLBACK completed.

The fixture used two synthetic `example.invalid` accounts, with no sending API.
After rollback: Auth users 7, profiles 6, reminder preferences 4, marketing
preferences 0 and reminder jobs 1 — identical to the captured baseline.
Remaining `qa-i18n-…@example.invalid` users: 0.

The five existing Edge Functions now include the shared four-language allowlist:

| Function | Active version |
| --- | --- |
| auth-send-email | 8 |
| account-locale | 4 |
| wishlist-email-preferences | 6 |
| wishlist-email-management | 3 |
| wishlist-reminder-dispatch | 8 |

The signed Auth template adds ES/PT; the existing reminder template adds ES/PT.
Payloads were built from the downloaded active sources, overlaying only the
shared language configuration and required translated email modules. Existing
remote security-code differences, function configuration and recipient scope
were preserved. Readback confirmed the configuration bytes are unchanged in all
five functions. Dependency resolution uses an explicit import map to the already
pinned `@supabase/supabase-js@2.118.0`; no new dependency was introduced.

Native Deno checking passed for all five exact payloads. The first exact-payload
check lacked the import map and failed dependency resolution; adding that map
resolved the diagnostics. The deployed Auth hook rejected an unsigned POST with
HTTP 401. No real signup/sign-in email, reminder or promotional email was sent.

User confirmed that the test redirect allowlist uses
`https://amico-fabio-iyzo.vercel.app/**`, covering both new callback routes.
Dashboard inspection itself was blocked by automatic approval review's usage
limit; this allowlist fact is user-confirmed, not independently read back.
Actual inbox delivery and authenticated cross-browser ES/PT journeys remain
final user tests, not agent-verified results.
