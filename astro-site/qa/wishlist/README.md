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
