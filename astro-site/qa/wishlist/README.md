# Guest wishlist verification

## Task 1: local persistence foundation (2026-10-23)

Pure domain functions normalize stable tour IDs and apply idempotent desired
states. The data adapter stores one versioned key per tour, so another tab's
unrelated additions cannot be overwritten by a stale array. Same-tour conflicts
use the last completed storage operation. No personal data or catalog snapshots
are stored. Unknown/unpublished IDs are retained for later presentation filtering.

Unavailable storage, corrupt values, thrown reads/writes and silently discarded
writes return explicit failure. The adapter never clears unrelated storage.

Actual verification with external Node v24.21.0:

```text
node --test src/features/wishlist/data/__tests__/guest-storage.test.mjs
tests 5; pass 5; fail 0
npx vitest run src/features/wishlist/domain/__tests__/wishlist.test.ts
Test Files 1 passed (1); Tests 3 passed (3)
npx astro check
Result (193 files): 0 errors; 0 warnings; 0 hints
npm run build
Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings.
90 page(s) built in 11.78s
Complete!
```

The first sandbox build failed with a Supabase network timeout. The network-enabled
retry above passed; no provider fallback or fixture substitution was used. The
existing Browserslist freshness notice remains; dependencies were not changed.

UI and browser integration follow as a separate focused task. This foundation
does not implement Auth, account synchronization, reminders, or deployment.

## Task 2: guest interface (2026-10-23)

Implemented tour-only hearts in Explore and tour details, a header link, and
static IT/EN favorites pages. Static pages render published tour content at build
time; browser code only reads saved IDs and shows the corresponding cards. No
customer data, prices or translations are stored in localStorage. Unpublished
or removed IDs do not appear, and stored IDs are not silently destroyed.

The user requested UI UX Pro Max guidance and the existing theme. The skill was
installed outside the repository. Its generated palettes/fonts did not fit the
existing product; the implementation keeps local fonts and current black/gold
tokens, and applies its guidance on native buttons, SVG icons, 44px targets,
pressed semantics, visible focus, responsive layout and reduced motion. No new
project dependency was installed.

Actual outputs:

```text
npm test
tests 91; pass 91; fail 0
Test Files 7 passed (7); Tests 99 passed (99)
npx astro check
Result (202 files): 0 errors; 0 warnings; 0 hints
npm run build
Verified canonical and reciprocal hreflang for 90 indexable pages
92 page(s) built in 10.95s
Complete!
```

The browser script checks Italian and English at 375px and 1440px, persistence
after reload, removal propagated to an already-open tab, cross-language saved
state, existing representative card text/price/detail-link preservation, and no
page errors. Additional checks cover 768px/1024px overflow, denied localStorage
(honest errors without a saved state), and disabled JavaScript (honest guidance,
no misleading empty state or inert visible save buttons).

Run against built static files with the available external Playwright package
and an installed browser. Neither needs to be a project dependency:

```powershell
# Set PLAYWRIGHT_MODULE to the external playwright/index.mjs when not installed locally.
# Set QA_BROWSER to the installed browser executable if no Playwright browser is present.
# Start a static file server for dist/; set QA_ORIGIN to its local address.
node qa/wishlist/browser.mjs
```

`baseline.json` records the representative pre-change Explore card in both
languages at matching mobile/desktop widths; `browser-results.json` records the
comparison and behavior results. Screenshots live in ignored `screenshots/`:
`before-<locale>-<width>-explore.png`, `before-<locale>-<width>-tour.png`, and
`after-<locale>-<width>-{explore,tour,wishlist,empty}.png`. Tablet empty-state
screenshots are also captured. The final capture helper loads lazy images before
capturing; the original baseline full-page captures contain unloaded images below
the viewport. This is a capture limitation, not evidence of missing image links.

Comparison scope: these are new features, so the legacy site has no favorites
page to compare. The existing Astro Explore and representative tour were captured
before/after at 375px/1440px in IT/EN. Existing content markup, data/image links,
prices and booking links were retained by diff inspection; automated card-content
comparison passed. The only intended differences are the new heart controls,
header favorites link and the space occupied by those controls. No missing
existing sections/text/prices/links were identified within that review. This is
not a fresh exhaustive parity audit of every legacy tour and package.

No schema writes, Auth flow, reminder delivery, hosting changes or deployment
are part of this task. Account synchronization and email features remain pending.

## Header favorite count

The heart link now has a gold count badge (including zero), populated from the
same validated browser wishlist as the save/remove controls. Its localized
accessible label includes the count. The shared feature interaction module is
also imported by the header link, so pages without save buttons stay in sync.
The badge is positioned within the existing 44px control without changing its
size. It updates after successful saves, on storage events, focus and pageshow.
Unreadable storage retains a previously known count; initial failure leaves it
hidden rather than inventing a number. This remains the existing browser-local
wishlist; no account synchronization was added.

Verification: `node qa/wishlist/count-browser.mjs` passed 4 Italian/English x
375/1440 cases: zero, add/remove, reload, a header-only legal page, cross-tab
updates, clearing saved items, unchanged link geometry and unavailable storage.
Screenshots remain local and ignored. Run with external PLAYWRIGHT_MODULE and
QA_BROWSER; QA_ORIGIN defaults to http://127.0.0.1:4322.

`npm run build`: catalog validated (22 trips, 14 packages, 3 addons, 1 settings);
94 pages built in 21.46s; Complete! Existing Browserslist age warning remains.

`npx astro check`: Result (224 files): 0 errors; 0 warnings; 0 hints.

## Revision-safe merge foundation (not activated)

Guest storage accepts existing `1` values and new per-save v2 UUID revisions.
Existing IDs/keys remain intact; no migration wipes browser data. Pure merge
rules union published missing IDs and identify cleanup only for read-back
confirmed revisions under the same account/generation. Legacy ambiguous values
are never directly eligible for cleanup. Conditional cleanup/promotion helpers
will be called only under the future shared guest lock by the sync coordinator.
No account network calls or automatic cleanup are wired into the site yet.

Real output: guest storage tests 8 passed, 0 failed; Vitest wishlist domain
2 files / 8 tests passed; Astro check (226 files) 0 errors, 0 warnings, 0 hints;
build 94 pages in 5.63s, Complete! Browser count regression suite passed all
4 language/viewport cases (add/remove, reload, cross-tab and storage failures).

## Account-bound coordinator and guest claims (not activated)

Account loading/editing is serialized and responses are bound to an account and
session generation. Merge performs inserts only, reads back the result, then
acknowledges only confirmed guest revisions. A missing schema/network failure
never becomes synchronization success. Partial batch failures retain unconfirmed
guests. A late response from account A cannot replace account B's visible list.

Guest operations share a Web Lock. Per-item claims bind in-flight revisions to
one account for a ten-minute attempt window; expiry or another account requires
an explicit new merge action. There is no consent or authentication in these
records. Completed claims are removed. No-lock browsers retain guest data and
report the inability to merge rather than risk deleting data.

Acknowledgement now uses a revision-specific marker instead of compare/delete:
a localStorage compare/delete is not atomic against an older uncooperative tab.
The marker logically removes only that revision from guest reads; a concurrent
remove/re-add has a different UUID and stays visible. No entire guest list or
browser storage is wiped. This supersedes the earlier conditional-delete sketch.
Revision markers contain no profile data; unresolved claim retention and broader
account deletion/export remain launch gates, not implemented email policies.

Actual checks: guest-storage/claim/coordinator node tests 19 passed, 0 failed,
including a simulated write between read and acknowledgement; Astro check
(235 files) 0 errors, 0 warnings, 0 hints; 94 pages built in 5.79s, Complete!
The next UI task must keep account sync disabled until schema/RLS verification.
