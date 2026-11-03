# Language-link activation on Apple browsers — 2026-11-03

Scope: repair language selection; biography is explicitly deferred by the owner.
No visual, content, catalog, authentication or provider changes.

The existing header closed a disclosure both on focusout and synchronously in
the link's click handler. WebKit cancels native link navigation when that
handler hides its containing details. Chromium continued navigating, which
explains why Chromium-only mobile viewport checks missed this defect.
Safari's different pointer-focus behavior also makes null relatedTarget an
unsafe signal for dismissing links before activation. Reference:
https://bugs.webkit.org/show_bug.cgi?id=312692 .

Reproduced against both the previous local static build and the actual public
https://fabioegypt.com site: WebKit 26.0 failed language selection on iPhone 13
and iPad (gen 7) device profiles; Chromium 145 passed both. No page errors.
See apple-touch-before.json and apple-touch-live-before.json. These are real
browser engines with device emulation, not physical-device verification.

The fix leaves full-document anchors rendered during native activation.
Known focus destinations close other disclosures through focusin; outside
click, Escape and opening another disclosure still dismiss them. Same-document
fragment links close in the next task after their default action. No routing
interception, user-agent detection, preventDefault or new dependencies.

Verification on the rebuilt local artifact:

```text
Node v24.21.0
npx astro check
Result (730 files): 0 errors, 0 warnings, 0 hints
npm run build
Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings.
Verified canonical and reciprocal hreflang for 230 indexable pages.
572 page(s) built in 21.46s; Complete!
QA_PHASE=after node qa/header/apple-touch.mjs
WebKit 26.0: iPhone 13 PASS; iPad (gen 7) PASS
Chromium 145.0.7632.6: iPhone 13 PASS; iPad (gen 7) PASS
```

Each after case taps through EN, ES, PT, DE and IT; verifies resulting URLs and
document languages; checks Escape dismissal, mutually exclusive disclosures,
USD selection and a real mobile-menu route. Existing IT/EN biography dialogs
also opened without changes, but the owner's physical-device issue is deferred.
No Auth, email, consent grant or booking submission. External requests are
blocked in browser QA. Screenshots stay in the ignored screenshots directory.

Re-run with PLAYWRIGHT_MODULE pointing to an external Playwright index.mjs,
QA_ORIGIN pointing to a local static server, and QA_PHASE=after. WebKit was
installed outside the repository in the existing Playwright browser cache.
Astro preview was unresponsive in this environment, so QA used Python's static
HTTP server for dist. The optional 21st review command could not run: CLI was
unavailable and registry resolution returned ENOTFOUND; it is not a passing
check. Manual source review and actual engine tests supply the evidence above.

The source fix is local at this checkpoint. Production publication requires
the owner's explicit extension of the repository's production restriction.
