# Egypt tailor-made request — 2026-10-29

Owner authorization: implement the reference-inspired tailor-made form for Egypt
only, skipping the multi-country chooser and omitting the flight-offer option.
The latest instruction also opens editorial hyperlinks in new tabs.

## Implemented contract

- /it/tailor-your-trip/ and /en/tailor-your-trip/, static Astro routes.
- Egypt is fixed, not a required city selection. Optional places/start/finish
  fields and required route/details text support a complete country-wide request.
- Required: full name, syntactically valid email, nationality from existing
  reference data, international phone number, arrival/departure dates, traveller
  counts (defaults 2/0/0), positive indicative budget and meaningful trip details.
- Adults 12+, children 2–11, infants under 2 are intake categories only. They do
  not alter existing booking prices or policies. Counts have a technical 0–99
  input bound (adults at least one), not a published capacity guarantee.
- Dates must be real calendar dates, arrival today/future, departure not before
  arrival. Same-day requests remain possible; no unapproved minimum-night rule.
- Budget is entered by the visitor in EUR or USD, per person, excluding flights.
  No copied competitor bands, conversion, quotation or price calculation.
- No flight-offer, departure-airport or international-flight booking fields.
- Review is disabled until native constraints and pure domain validation pass.
  Inline errors appear on interaction; review/edit preserves the current draft.
- Explicit WhatsApp handoff follows review. No API/database/email sending,
  request-received claim, generated itinerary or automated reservation exists.
- Draft and prepared message stay in page memory. No app storage, URL/query
  serialization, personal-value logs or personal analytics parameters. Browser
  autofill remains a normal user/browser capability, not app-side persistence.
- Personal WhatsApp text stays out of anchor href attributes. The handoff button
  opens the prepared URL from memory; the bare public-number fallback supports
  same-tab navigation. Analytics records only consented static handoff context.

## Architecture and navigation

domain/: pure typed validation/message construction and tests. data/: public
nationality choices through the booking feature's existing function.
presentation/: one Astro page, scoped CSS and small Vanilla JS controller.
Thin localized routes use the shared editorial shell and approved brand palette.

UI/UX Pro guidance applied: required indicators, recognizable disabled state,
field labels, grouped information, clear review feedback and keyboard focus.
The reference is inspiration; content and implementation are original.

Shared main/editorial headers expose Tailor a Tour / Viaggio su misura.
Customize Your Dream Vacation cards now open this page, replacing their old
temporary inquiry-dialog action. The short article inquiry form remains a
separate quick-contact flow. Planner pages do not mount that unused old dialog.

Editorial body links (automatic, manual, sources and supported raw HTML anchors)
and content/product cards use target=_blank and rel=noopener noreferrer. Reading
index fragments and normal site navigation stay in the same tab. New-tab behavior
is rendered into static HTML rather than depending on a click-only controller.

## Verification scope

Pure planner cases, safe analytics payload, changed native Markdown behavior,
six planner layouts, two intercepted review/handoff flows, and four main-header
entry points. Header sizing fixes are scoped to the added navigation control;
the narrow main header keeps its existing logo without duplicate brand text.
No unrelated Auth/catalog/reminder suite is part of this task. One grouped static
artifact checkpoint follows the feature's focused browser review.

Deployment, newsletter/channel subscriptions, email dispatch, backend lead
storage, live travel quotes and automatic itinerary generation remain separate.
Reference: https://www.memphistours.com/tailor-make-your-trip
