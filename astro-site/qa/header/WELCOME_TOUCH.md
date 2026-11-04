# Welcome campaign touch and form repair — 2026-11-03

Three independently reproduced defects were corrected during the iPhone audit:

1. Dismissed CookieConsent content retained a WebKit touch hit region on the
   welcome campaign. Touches targeted cm__desc although its computed visibility
   was hidden and opacity zero. Explicit pointer-events:none on closed consent
   panels/descendants restores the form CTA. The active panels remain interactive;
   both show--consent and show--preferences states are respected.
2. Welcome inputs inherited white body text on the light form card. A campaign
   scoped input/caret color now uses the existing dark brand token. Measured
   sRGB contrast after the fix is 14.8:1 against the existing input background.
3. The fixed decorative backdrop covered the footer cookie-preferences button.
   elementFromPoint at its center returned the backdrop. Decorative backdrop and
   scroll-hint layers now ignore pointer events. No visible design is changed.

Before evidence: welcome-touch-before.json; local ignored screenshots in
screenshots/extra-welcome-cookie-probe/, extra-welcome-consent-probe/ and
extra-welcome-footer-before/. Final results: iphone-extra-final.json.

Actual final implementation checks, Node v24.21.0:

```text
npx astro check
Result (733 files): 0 errors, 0 warnings, 0 hints
npm run build
572 page(s) built in 14.43s
Verified canonical and reciprocal hreflang for 230 indexable pages.
Complete!
QA_PHASE=final node qa/header/iphone-extra.mjs
iPhone SE: invoice PASS; offer PASS; welcome PASS (contrast 14.8)
iPhone 13: invoice PASS; offer PASS; welcome PASS (contrast 14.8)
iPad (gen 7): invoice PASS; offer PASS; welcome PASS (contrast 14.8)
```

Each welcome case rejects optional cookies, attempts an empty form, fills name
and telephone, submits to an intercepted local error response, verifies the error
alert/re-enabled button and retained input, reopens/closes cookie preferences,
then retries. Two synthetic POSTs per case, zero external lead POSTs. Continuous
legacy CTA animation is preserved; QA touches its measured center after an instant
scroll rather than waiting for an animated rectangle to become stable.

Invoice and offer checks guard neighboring flows. External network traffic is
blocked; WhatsApp opens are intercepted. The test proves client behavior and
error recovery, not actual Google Sheets delivery, WhatsApp sending or inbox
receipt. No deployment or provider settings changed.
