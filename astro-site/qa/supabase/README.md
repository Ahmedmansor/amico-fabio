# Existing Sheets catalog verification — 2026-10-15

The user authorized remote execution after reviewing preparation. Schema and
import are now applied: see remote-import.json for verified counts, grants and
advisor results. The preflight notes below describe the exact input snapshot.

The user's clarified rule resolves the earlier 12 blank-d_adult blockers:
nonblank d is final, blank d selects p. Both child inputs blank means zero;
both adult inputs blank or an invalid selected amount fails. Zero is preserved.
The earlier d-only interpretation is superseded in AGENTS.md and SUPABASE_PLAN.md.

The fresh snapshot contains 22 published trips, 14 published packages, 3 active
addons, 20 package/trip relations and 2 source settings. Existing catalog ID,
translation, image and relationship validation passed. Single-price preflight
passed with zero issues. sheets-preflight.json records source counts/checksums,
the 12 selected adult base amounts, default conversions and excluded placeholders.

Original snapshots stay in ignored supabase/local/. Prepared normalized CSVs,
schema, reviewed counts and user-run import steps are in supabase/README.md.
The initial empty-database inspection was followed by authorized schema and
import execution. All imported fields match the CSVs. Anonymous table writes
are denied and unpublished records are hidden. Provider integration follows;
Auth and suggested additional features remain deferred.

Actual local results:

- Sheets preflight: price-preflight-passed; 0 issues.
- Export: trips.csv 27 rows; packages.csv 14; package_trips.csv 20;
  trip_addons.csv 3; public_settings.csv 1.
- Import tests: tests 4; pass 4; fail 0.
- Astro check: Result (174 files): 0 errors, 0 warnings, 0 hints.
- Astro build: 90 page(s) built in 14.46s; Complete! (exit 0).

The build retains its existing Browserslist age warning. No dependencies changed.
Schema/import execution is also complete, as recorded in remote-import.json. Do not report the site as using Supabase until subsequent live
provider checks and the separately approved environment/deployment switch pass.
