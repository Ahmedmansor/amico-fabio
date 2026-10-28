# Tailor-made Egypt planner and new-tab links

2026-10-29, existing Astro migration branch. The owner requested immediate local
implementation, Egypt only, required-field gating and no flight-offer service.

Focused real outputs from astro-site/ with Node 24.21.0:

```
vitest run src/features/trip-planner src/features/blog/presentation/markdown/__tests__/processor.test.ts
Test Files 2 passed (2); Tests 17 passed (17)
npm run check:blog
tsc --noEmit --project scripts/blog/tsconfig.json
exit 0
```

The first type run identified a missing native HAST root narrowing; it was
corrected before the passing run above. Vitest's existing include list initially
excluded the new planner presentation test; a narrow include was added, then:

```
vitest run src/features/trip-planner/presentation/__tests__/analytics.test.ts
Test Files 1 passed (1); Tests 1 passed (1)
```

No unrelated feature suite was run. Domain cases cover required fields, real/
ordered dates, phone/email syntax, positive decimal budgets, count constraints,
optional route fields and Unicode/special-character message preservation.
Analytics asserts consent and the exact non-personal event fields.

Browser proof: scripts/trip-planner/capture-planner.mjs, BROWSER.json and ignored
screenshots under qa/trip-planner/screenshots/. Six IT/EN cases at 375/768/1280px
verify one H1, unique IDs, no overflow, no country chooser/flight fields and initial
disabled review. EN mobile and IT desktop scenarios completed invalid gating,
valid review, edit retention, encoded WhatsApp navigation (intercepted only),
bare fallback href and reload reset. No real request/message/email was sent.

Actual popup checks confirm article → guide and contact-card → planner open new
tabs while retaining the article; reading-index anchors stay local. Existing
developer scripts that navigate these links were updated for the new tab policy.

The first browser pass found an unused hidden old inquiry form mounted by the
shared shell; planner pages now omit it. Subsequent layout passes exposed the
expanded editorial header at phone/tablet widths and the original main header's
grid clipping. Fixed with compact navigation/brand sizing and a mobile logo-only
main-header brand. The six form cases and popup checks completed before the last
main-header fix. Only the affected main-header checks were rerun afterwards
(`--headers-only`), retaining earlier unchanged form evidence instead of repeating
the two full handoffs. Four IT/EN main-header cases at 375/1280px passed.

Combined runner output after that scoped follow-up:

```
PASS: six IT/EN planner layouts; required/invalid gating, edit/review, encoded WhatsApp interception and reload reset.
PASS: content/CTA links open new tabs, TOC stays local, and main headers expose the planner at mobile/desktop widths.
```

The referenced runner's earlier nonzero exits are recorded above, not described
as full passing runs. No personal values are stored in QA JSON; form examples
use reserved example.com addresses and synthetic contact details.

Grouped static checkpoint (one production-policy build, process-only existing
PUBLIC_AUTH_PASSWORD_ENABLED=0 override; no hosting/env-file edits):

```
npx astro check --tsconfig scripts/blog/tsconfig.json
Result (71 files): 0 errors; 0 warnings; 0 hints
npm run build
Verified canonical and reciprocal hreflang for 94 indexable pages
Checked 165 generated text files; fixture artifact policy verified
103 page(s) built in 14.22s
Complete! exit 0
```

The two permanent planner routes are present in the static artifact; protected
design articles/place guides remain excluded. Changed Markdown behavior also
has direct native-render tests and actual dev popup proof; the production
artifact correctly contains no fixture article body. No second broad build or
unrelated suite was run for this task. The noindex local dev preview is restored
for review. No deployment or real inquiry was sent.

Focused implementation commits: 68693f3 (new-tab reading links) and 130ff2e
(Egypt-only planner and navigation). Final evidence/authoring updates are saved
in a separate documentation commit. Ready review URLs:
http://127.0.0.1:4327/it/tailor-your-trip/ and
http://127.0.0.1:4327/en/tailor-your-trip/.
