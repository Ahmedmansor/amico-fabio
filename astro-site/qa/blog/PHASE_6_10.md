# Blog article and WhatsApp interaction milestone (phases 6 + 10)

2026-10-28. Combined browser acceptance avoids recapturing a placeholder form.
Phases 7–9 and authoring/final integration remain separate next tasks.

## Implemented

Article routes, hero/byline/metadata/chips/breadcrumbs, optimized body images,
captions, first-image CTA and no-image fallback, related articles, desktop sticky
inquiry, mobile action/dialog, unique form IDs, local validation, review/edit,
prepared WhatsApp navigation, in-memory mount synchronization and consent-gated
non-personal handoff analytics. Existing nationality choices are exposed through
a small public booking-data accessor; existing booking behavior was not changed.

No database, Supabase inquiry adapter, API, email sending, subscription consent,
PII logging or persisted form data. UI explains that the visitor sends the
prepared message inside WhatsApp; no received/delivered/confirmed state is shown.

## Focused outputs

```text
processor.test.ts: 7 tests passed (caption/CTA/nesting/fallback/alt/isolation).
inquiry.test.ts: 7 tests passed (validation/calendar/counts/locale/encoding/source).
analytics.test.ts: 3 tests passed (consent gate/non-personal event/unavailable tag).
npm run check:blog: no diagnostics; exit 0.

capture-articles.mjs: 9 article captures passed.
IT mobile and EN desktop validation/review/encoded WhatsApp handoff passed.
Escape/focus restoration, cross-viewport draft continuity and reset after reload passed.
```

ARTICLE_COMPARISON.json covers long/short IT/EN articles at mobile/desktop plus
one tablet view. Screenshots remain local/ignored. The driver waits for requested
lazy images to finish instead of confusing incomplete decoding with a broken
image. A harness-only English route-name typo was corrected; seven completed
unchanged application cases were retained explicitly, then two remaining short
article cases completed. This was not reuse across an application revision.

## WhatsApp URL privacy refinement

Google documents that enhanced outbound click measurement can collect full
link_url independently of manual events:
https://support.google.com/analytics/answer/9234069?hl=en

The final handoff uses a button and window.open from the explicit gesture, keeping
the personal prefilled URL only in memory. The fallback DOM anchor contains only
the public business number; its JS handler navigates in the same tab using the
prepared URL. No raw personal message is assigned to a DOM href or GA4 payload.

Only the two affected handoff scenarios were rechecked after that refinement:

```text
capture-articles.mjs <runtime> <chrome> --handoff-only
PASS: 2 article captures; responsive layout, unique IDs and image/CTA cases verified.
PASS: IT mobile and EN desktop validation/review/encoded WhatsApp handoff; intercepted only, no real send.
PASS: Escape/focus restoration, cross-viewport draft continuity and no persisted form values after reload.
Exit code: 0.
```

WHATSAPP_HANDOFF.json is the later behavioral evidence. All wa.me navigation was
intercepted in the test browser; no request or message reached WhatsApp. Manual
analytics logic is tested synthetically, not claimed as verified live GA4 delivery.
No whole-site build or unrelated feature suite was repeated for this milestone.

Subsequent static review added method=dialog and an initially disabled review
button that unlocks only after listeners are attached, preventing native GET
submission of fields if enhancement is unavailable. A non-hoisted noscript
fallback offers the bare public WhatsApp link. Final integration covers this
progressive-enhancement guard; the earlier browser result is not relabeled as
verification of that later attribute change.
