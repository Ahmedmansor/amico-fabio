# Welcome landing campaign

The Italian-only legacy `welcome.html` now renders at `/welcome/` through Astro.
Its feature has data, pure domain/tests and presentation, with the neutral shared
document shell and scoped campaign CSS. This page intentionally retains its own
blue/green design and empty header/footer. No English version is invented.

All source text, Name/WhatsApp fields, existing public Google Apps Script URL,
WhatsApp message and three repeated placeholder review images are preserved.
The four original source assets are copied byte-for-byte. The background URLs
are resolved locally and portrait/review images use Astro optimization. Tailwind
and fonts are local; no runtime CDN or Google Fonts dependency remains.

The feature browser script submits the same FormData keys, waits for an HTTP
success with a JSON acknowledgment (`result/status: success` or `success: true`),
then opens the original WhatsApp message through shared public contact config.
HTTP failures, explicit errors, unrecognized responses, JSON failures and a
20-second timeout restore the button and show the original connection error.
The old handler continued after any HTTP response; this defect is corrected.
Shared GA4 records generate_lead only after acknowledgment, without form values.

No real lead was submitted to Apps Script or WhatsApp. The endpoint's live
response contract is not independently confirmed; the migration does not claim
an end-to-end external integration pass. An authorized test submission is needed
before relying on campaign lead delivery. There is no no-cors workaround or
unchecked success redirect. Required fields were tested empty in the browser;
native validation prevented submission and the button remained enabled.

`comparisons.json` records matching Italian text, input attributes and image
loading at 1440×900 and 390×844. Screenshots stay local/Git-ignored. Small layout
differences from Tailwind and scrollbar sizing remain; no text, image, price or
link is missing. The card top offset and outer padding retain the legacy rules.
No source redesign or additional commercial copy was introduced. Source review
images remain placeholders and the original TripAdvisor claim remains unchanged.

```sh
npm test
npx astro check
npm run build
node scripts/verify-welcome.mjs
node scripts/verify-seo.mjs
```

The original `welcome.html` and prior unchanged archive in `landing-pages/` stay
untouched. The active page lives in the welcome feature, not the archive. No
library was added and no production deployment or domain change occurred.
