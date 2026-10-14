# Independent bilingual tour pages

All 22 published Google Sheets trips generate their own static Italian and
English page, 44 routes under `/it/tours/<slug>/` and `/en/tours/<slug>/`.
Existing stable IDs and initial slugs are separate model fields; initially the
same existing ID text is used for both languages' slug. Explore trip cards now
link directly to these routes. Package cards retain their legacy links until
the separate package-page task is completed. No production deployment occurred.

## Preserved content and business behavior

The original detail markup/CSS, 8 FAQs, full dictionaries, highlights, program,
important notes, inclusions/exclusions, badges and all gallery links are retained.
Prices still come through `getTrips()` and addon data through `getAddons()` from
the existing Google Sheets provider. Galleries follow original `img_count` /
`TripsMetadata` rules; required gallery files and complete text are checked in
the data layer before publication. All original gallery files match byte-for-byte.
Astro produces optimized hero/gallery images with dimensions and responsive
sources. The gallery retains its 2-second rotation and thumbnail selection.

Booking is carried with the pages so a published tour does not lose its form.
Pure domain functions calculate totals, clamp traveler counts, validate the
original fields and build bilingual WhatsApp messages. Vitest compares totals
and complete messages with the actual legacy handler for all 22 fixture trips.
Extras remain charged per traveler, including children. Explicit discount zero,
blank child-price zero and blank minimum one keep the approved legacy defaults.
The sidebar/hero still use the legacy display-price rules separately from the
booking price model; no policy, price or commercial wording was changed.

## Source defects handled without redesign

- The old HTML contains two `detail-desc` IDs; only the first receives content.
  The empty second paragraph stays empty to preserve visible source behavior,
  with a unique `detail-secondary-desc` ID to avoid invalid DOM identity.
- A fresh direct legacy detail visit can leave the form in its skeleton state
  after fetching prices. Astro renders prices/form from validated build data;
  comparison uses the legacy site's normal explore-to-detail flow, which warms
  its real API cache and renders its working form. No fixture was injected into
  the browser, and no network fallback price was invented.
- Date-picker calls are guarded so browser gesture restrictions do not crash
  the interaction. The minimum date is refreshed in the browser using the same
  UTC date rule as legacy instead of becoming stale between static builds.
- Personal form values in the invoice are escaped before inserting markup.
  The visible source labels remain the original English literals in both
  dictionaries; no unapproved replacement translations were invented.

## Verification

Each of the 44 language pages is compared at 1440×900 and 390×844 against the
real legacy page. `comparisons.json` records original text, prices/breakdown,
programs, lists, FAQ text, gallery counts and form defaults. Full-page screenshots
remain local and Git-ignored. DOM paragraph-boundary whitespace differs while
rendered blocks keep their source structure. Auto-rotating galleries may show
different slides between captures. Shared footer/navigation comparisons are
covered by earlier migrated-page reports and regression verification.

```sh
npm test
npx astro check
npm run build
node scripts/verify-tour-migration.mjs
node scripts/verify-explore-migration.mjs
```

The old compatibility URLs remain a separate pending task. Main source,
root package/lock/configuration and `main` are unchanged. No booking message is
sent during browser QA; confirmation/message behavior is tested in pure logic.
