# Correspondence policy implementation — 2026-10-25

- Browsing decoupling is source-implemented and browser-tested; see auth/LOCALE.md.
- First-consent UI exposes supported language selection, initially page language.
  Existing language is read-only there; explicit account settings change it.
- Command carries displayed consent language separately. Source backend now calls
  `change_wishlist_email_preference_v2`. Its unexecuted successor SQL is under
  `../../supabase/correspondence-policy/`: atomic audit time/version/text-language/
  correspondence-language, first-grant initialization and preserved re-enable.
- Reminder model validates stored locale at preparation; missing/unsupported uses
  shared Italian default without modifying input. Summary QA remains strict.
- Existing consent version/text is unchanged; final wording remains a release gate.

Actual checks: 244 Node tests passed; 19 Vitest files / 160 tests passed;
Astro 350 files, 0 errors/warnings/hints; normal static build 94 pages in 6.98s.
Four IT/EN Chrome mobile/desktop synthetic consent cases passed: selected language
differs from displayed text, same-ID retry, explicit settings and withdrawal.
Mobile screenshot visually inspected; no overflow. Results are in
`preferences-auth-browser-results.json`; local screenshots are ignored.

These are source/synthetic checks, not real SQL or signed-in consent evidence.
Keep opt-in off: successor SQL, native role/concurrency tests and Edge upgrade
must be separately reviewed before activation. No email or remote write occurred.

## No-login management continuation

Implemented locally: two static noindex pages, minimal scoped commands, hashed
capability issuer/repository/service, bounded public HTTP/client transports and
explicit unsubscribe/language UI. No Auth SDK, analytics or browser storage on
these pages. Read does not mutate; unknown write retries retain command identity;
conflicts display current state instead of overwriting; language never grants
consent. A second link in the same tab reloads rather than retaining an old token.

`prepareReminderMessage` resolves stored language once and prepares matching
IT/EN subject/content/item URLs and a localized fragment-only management link.
Missing/unsupported stored language uses Italian without modifying persistence.
This function does not send or authorize a reminder.

Final actual checks: **251 Node tests, 20 Vitest files / 163 tests passed**;
Astro **366 files, 0 errors/warnings/hints**; normal static build **96 pages in
19.26s**, with 90 indexable pages unchanged (two management pages are noindex).
Four synthetic Chrome IT/EN mobile/desktop cases passed after final refinements:
token-only read, same-ID lost acknowledgment recovery, withdrawal, language
change without resubscription, revision conflict and invalid second link.
Results: `management-browser-results.json`; ignored screenshots under screenshots/.
Mobile layout was visually inspected. These are not native expiry/RLS tests.

`../../supabase/correspondence-management/` contains unexecuted schema/role tests
and release instructions. Management flag remains off, no endpoint is deployed.
Distributed trusted ingress limiting, lifetime/expiry recovery/rotation/retention,
native disposable and concurrency tests, then a separately reviewed runtime
deployment and real inbox-link check remain activation gates. No real token,
remote schema write, subscription, provider setting or email was created.
