# Restricted real-reminder QA — deployed v5

This localhost-only tool tests the actual reminder template and saved language,
without waiting 24 hours or consuming/resetting the automatic reminder allowance.
It is not a customer-facing immediate-email feature.

- One fixed recipient and Auth UUID, sender, expiry and per-language job IDs live
  only in an ignored nonsecret configuration. Existing accepted jobs are preserved.
- Remote Auth verification and the account recipient allowlist are required.
  Wishlist reads retain the caller's RLS through the feature data layer.
- The browser sends no locale. The server reads saved reminder consent/language;
  disabled/missing consent blocks sending. Invalid saved language falls back to
  Italian, matching the real dispatcher. Explicit page-language overrides fail.
- The same prepareReminderMessage function renders tours, packages, WhatsApp CTAs
  and localized management links. A final saved consent/language read prevents
  sending content after a withdrawal or language change during preparation.
- Management capabilities use the reviewed explicit lifetime and real no-login
  service. User-confirmed unsubscribe/language actions affect real preferences.
- QA uses a separate private durable ledger. Repeated accepted jobs return
  already-sent with saved language; no provider call occurs. Unknown outcomes
  remain quarantined. Changing page language cannot select or create another job.
- Actual automatic reminder eligibility remains fixed at 24 hours; this tool does
  not modify activity, consent history, queue timing or the permanent allowance.
- New test content uses new immutable IDs, never old accepted/unknown message IDs.
  The test window and provider dispatch guard must both remain valid.
- Rendering uses the approved fresh static test catalog. Incomplete/empty account
  reads or invalid manifests block; no fallback to another recipient or origin.
- Existing server-only BREVO_API_KEY and built-in Supabase runtime bindings are
  used without reading, printing or committing their values. No SDK dependency added.

Prepare a disabled package with node qa/reminders/prepare-email-test-function.mjs.
An explicitly authorized ignored .astro/reminder-email-test-job.json prepares the
bounded enabled package. Preparation does not upload or send anything. Public
hosting flags remain off. See ../../../qa/reminders/ACTIVATION.md for evidence.
