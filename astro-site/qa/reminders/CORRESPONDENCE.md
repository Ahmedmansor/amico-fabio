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
