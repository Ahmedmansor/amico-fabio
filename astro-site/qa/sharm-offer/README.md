# Italian offerta-sharm campaign

The campaign stays at `/offerta-sharm/`, Italian only, with its intentional
header/footer, bright palette and original content. It uses the neutral shared
document shell/analytics/SEO, not the main-site UI or theme CSS. Campaign CSS
is scoped by `data-campaign="offerta-sharm"`, including its reset and colors.

All 11 source mount blocks are now static Astro components: header, hero,
floating WhatsApp, four benefits, eight destinations, four booking steps, six
Vimeo testimonials, four FAQs, form, five trust badges and footer. Content is
extracted from the real legacy modules into 136 Italian keys. Seventeen image
associations retain original file bytes, with optimized output and dimensions.
The extraction script is one-time migration tooling, never shipped to browsers.

## Comparison and interactions

Legacy and the actual production build were compared at 1440×900 and 390×844.
`comparisons.json` stores each block's text, image alt identities, links, video
IDs and original form defaults. No section, copy, image, price or link is missing
or incorrect. Minor optimized-image encoding differences are expected. The
first comparison exposed a reset scope/inline-space difference; both were fixed
before the recorded comparisons. Palette/font/layout remain the source design.

Four full-page screenshots and a preview stay local and Git-ignored. Offscreen
video thumbnails are lazy-loaded and the rotating carousel may display a
different card between screenshots. All six buttons were exercised and open
the matching Vimeo iframe/title, which is removed on close. The external Vimeo
service controls actual streaming availability; iframe routing was verified,
not completion of every video playback.

The menu opens/closes and reaches FAQ; the second FAQ opens and closes the first.
Empty form submission exposes the original name/date errors; travelers=31 adds
the original people error. No valid lead was submitted in the browser and no
WhatsApp message was sent. Vitest compares complete valid WhatsApp message
generation and validation against the actual legacy handler in an isolated
test harness, including 1/30 traveler boundaries, Unicode, whitespace and its
existing `parseInt` behavior. No prices or booking policies were changed.

## Tests and publication

`vitest@5.0.4` is the user-approved exact development dependency. `npm test`
runs existing Node tests and Vitest; `npm run test:domain` runs Vitest alone.
It is not included in production browser scripts. The form's `generate_lead`
event retains original currency/value/category/label through shared analytics;
no personal input values are passed. Domain functions do not access DOM,
network, environment or analytics.

Required copy, language publication, image files and duplicate campaign routes
are validated during generation. Campaign dictionaries are checked only for
published languages, so adding a language without content fails. Canonical is
the unchanged campaign URL; no fictitious English hreflang is emitted.

From `astro-site/`:

```sh
npm test
npx astro check
npm run build
node scripts/verify-offer-migration.mjs
```

Also rerun the home/legal/explore/guide verification scripts after changing the
neutral shell or shared SEO. No legacy source, root manifest or build config
was changed. Deployment and redesign are not part of this task.
