# Nationality first-tap repair — 2026-11-03

The iPhone user-journey audit reproduced a second WebKit defect: after editing
the trip-planner form, tapping the nationality trigger did not open the list
until a second tap. The initial audit reproduced this in IT/EN on both iPhone
13 and iPad profiles. Event tracing observed touchstart/touchend and mouseup
but no click on the first tap.

The select's aria-invalid MutationObserver re-rendered the selected label on
every validation, replacing its text/flag nodes even when selection had not
changed. WebKit can suppress clicks when their underlying content is replaced:
https://bugs.webkit.org/show_bug.cgi?id=252810 . Preserving the existing nodes
until the selected value changes restores the first click. Validation state,
native select fallback, country values and visual design are retained.

Actual checks after this focused source change (Node v24.21.0):

```text
npx astro check
Result (733 files): 0 errors, 0 warnings, 0 hints
npm run build
Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings.
Verified canonical and reciprocal hreflang for 230 indexable pages.
572 page(s) built in 15.43s; Complete!
node qa/header/nationality-touch.mjs
iPhone 13 / it: firstTouchOpens, selection, reopenAfterValidation, changeSelection
iPhone 13 / en: firstTouchOpens, selection, reopenAfterValidation, changeSelection
iPad (gen 7) / it: firstTouchOpens, selection, reopenAfterValidation, changeSelection
iPad (gen 7) / en: firstTouchOpens, selection, reopenAfterValidation, changeSelection
```

Regression test results: nationality-touch.json. Each case edits the textarea,
opens the list with one touch, chooses Italian, edits again and chooses French
with one touch. External requests are blocked. No account, lead, email or booking
is created. Real WebKit engine with touch/device emulation; physical iOS testing
is not claimed. Full usability audit continues separately. No deployment.
