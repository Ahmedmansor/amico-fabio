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
are denied and unpublished records are hidden. Build-time provider integration is now verified;
Auth and suggested additional features remain deferred.

Actual local results:

- Sheets preflight: price-preflight-passed; 0 issues.
- Export: trips.csv 27 rows; packages.csv 14; package_trips.csv 20;
  trip_addons.csv 3; public_settings.csv 1.
- Import tests: tests 4; pass 4; fail 0.
- Astro check: Result (174 files): 0 errors, 0 warnings, 0 hints.
- Astro build: 90 page(s) built in 14.46s; Complete! (exit 0).

The build retains its existing Browserslist age warning. No dependencies changed.
Schema/import execution is also complete, as recorded in remote-import.json. The Astro provider checks below pass; the published legacy site requires a
separately approved Astro environment/deployment switch before it uses Supabase.

## Completed build-time integration

The default Astro provider now reads Supabase with the modern publishable key.
Feature access functions and domain validation remain shared. All imported
catalog fields, prices, editorial flags/badges, images, texts and relations match
the reviewed Sheets snapshot. Public REST probes expose no inactive trips or
non-allowlisted settings. No Google Sheets request occurs in this verifier.

provider-verification.json records full catalog parity and all 90 generated HTML
pages. 86 pages are byte-identical to the original Sheets build; the remaining
4 differ only because raw addon source metadata was removed from browser JSON.
After normalizing that intentional metadata removal, all 90 match exactly.
No catalog endpoint or key appears in HTML/browser bundles. The normal static
artifact remains dist/. The isolated noindex artifact is under ignored
supabase/local/test-dist/ and contains 88 noindex content pages, an empty sitemap
and social images on its own localhost origin. Both local previews return real
HTTP 404 responses with bilingual recovery pages.

browser-checks.json records fresh IT/EN captures at 1440x900 and 390x844. Named
JPG captures remain local/ignored. The tour shows one €40 headline and €40 initial
total with no discount markup or horizontal overflow. A browser interaction with
2 adults, 1 child and the €15 diving addon produced €144.5 as expected. No lead,
booking or WhatsApp confirmation was submitted. Broader source/visual evidence
remains in qa/single-price/ and the original migration reports.

Final actual results:

- npm test: Node tests 86 passed, 0 failed; Vitest 96 passed in 6 files.
- npx astro check: Result (187 files): 0 errors, 0 warnings, 0 hints.
- Normal Supabase build: 90 pages in 6.01s, exit 0; output static.
- Isolated noindex Supabase build: 90 pages in 6.93s, exit 0.
- Live REST parity: 7 Supabase GET requests; zero Sheets requests;
  every normalized catalog field matches the reviewed snapshot.
- Static parity: 90 of 90 pages match, apart from removed addon source metadata.
- Links: 6523 local references, zero broken targets; 172 original placeholders retained.
- Sharing: 72 language detail pages and 36 poster associations pass.
- SEO: 88 production sitemap entries; both local 404/root probes pass.
- Single-price verification: 72 detail pages, 144 rendered cards and 12 stored
  representative browser pairs pass.
- Tour/package/explore verifiers pass; their original full-browser comparisons
  are explicitly historical baselines rather than new captures.

The existing Browserslist age warning remains. No new dependency was installed.
No hosting variables, domain, Git push or deployment was changed. The live legacy
GitHub Pages site continues its existing behavior until a separately approved
Astro deployment. Automatic rebuilds, leads and Auth remain outside this phase.

## Reproduce provider/build comparison

Keep the reviewed source snapshots under supabase/local/ (or run the read-only
Sheets audit and verify their hashes still match the import manifest). From
astro-site/, with the approved Node runtime and public catalog configuration:

1. Set CATALOG_PROVIDER=sheets, build, and run
   node scripts/verify-supabase-catalog.mjs --capture-sheets-baseline.
2. Select CATALOG_PROVIDER=supabase and build again into normal dist/.
3. For the isolated test artifact, set PUBLIC_NOINDEX=1 and
   PUBLIC_SITE_URL=http://127.0.0.1:4322, then run
   npm run build -- --outDir supabase/local/test-dist. Clear those two test
   variables afterwards; retain the normal production artifact in dist/.
4. Run node scripts/verify-supabase-catalog.mjs. To repeat both HTTP probes,
   serve normal dist/ with Astro preview on 4321 and run
   node scripts/serve-static-qa.mjs supabase/local/test-dist 4322, then run
   node scripts/verify-seo.mjs. The QA server binds loopback only.

Do not re-import or reapply the schema when repeating read/build checks. The
original rls_auto_enable() findings in remote-import.json are historical.
The separately authorized follow-up is recorded in function-grants.json.

## Function permission follow-up — 2026-10-15

Applied migration 20261015033536_restrict_rls_auto_enable_execute using the
reviewed supabase/restrict-rls-auto-enable.sql. EXECUTE was revoked from PUBLIC,
anon and authenticated for this function only. Its postgres owner, definition
checksum, SECURITY DEFINER setting and enabled ensure_rls event binding are
unchanged. Owner EXECUTE remains true; both API-role EXECUTE checks are false.
All five catalog tables retain RLS, anon SELECT and no anon write privileges.
The security advisor now returns {"lints":[]}.

Actual checks: npx astro check: Result (187 files), 0 errors/warnings/hints;
npm run build: validated live Supabase 22 trips/14 packages/3 addons/1 settings,
90 static pages in 9.22s, exit 0. Existing Browserslist age warning remains.
No test table was created to exercise the event trigger. No dependency changed.
Blog implementation awaits a separate scope agreement; Auth remains deferred.
