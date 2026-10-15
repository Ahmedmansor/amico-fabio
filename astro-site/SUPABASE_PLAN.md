# Single-price catalog and Supabase migration plan

Status as of 2026-10-15: single-price UI implemented in `bf300d0` using the
clarified d-when-present, otherwise-p rule. The user explicitly authorized remote execution. The five tables, reviewed
grants/RLS and complete catalog import are now applied and verified on
`fabioEgypt`; migration `20261015025613`. Build-time Supabase provider integration
is implemented and verified: 22 published trips, 14 packages, 3 addons, 20
relationships and 1 allowlisted setting. All 90 generated pages preserve the
Sheets build output after removing source-only addon metadata.
See `qa/supabase/provider-verification.json`. Hosting environments and deployed
artifacts have not been changed.
Follow `supabase/README.md` and `qa/supabase/remote-import.json`.
Initial read-only connection check: `fabioEgypt` (`iiivnvwspoikfrlclhyr`), Ireland;
`public` tables and migration history were empty before the authorized migration.

## Boundaries and decisions

Confirmed 2026-10-15: migrate the four existing Sheets sources only. Do not add
Auth, price history, destination/category tables, a CMS, campaigns or inquiries.
The live site is static on GitHub Pages; no server hosting is planned. Supabase
catalog reads happen during Astro builds; generated pages need a new build to
reflect database edits. The separate static Vercel preview remains for testing.

Keep legacy main/GitHub Pages and Google Sheets untouched. Work in astro-site
on the migration branch. Test on the existing separate Vercel test project.
Do not create a second project or paid database branch.

The initial plan was user-run SQL and CSV import. On 2026-10-15 the user
explicitly authorized the agent to apply the reviewed five-table catalog,
grants/RLS and data import via MCP, verify it and implement the build-time
provider. This supersedes the user-run step only for this catalog migration.
No unrelated remote writes or hosting environment/deployment changes are implied.
Each implementation task requires checks, reviewed diff and a focused commit;
dependencies and deployment retain their separate approval rules.

## 1. Adopt one price while still using Sheets

- Map the nonblank `d_adult`/`d_child` amounts to `adult_price`/`child_price`.
  When a d cell is blank, use its matching p cell. Both child cells blank -> 0;
  both adult cells blank or an invalid selected amount -> explicit failure.
  Explicit zero wins over p. Confirmed 2026-10-15; supersedes the d-only rule.
- Remove base/discount properties from the active domain model and remove
  crossed-out prices, discount percentages, promotional price cards/messages.
  Do not remove unrelated Top/VIP/editorial badges or change promo-banner rules.
- Display a single starting adult price using approved Italian/English labels.
  Child price still participates separately in booking totals. Keep addon
  prices, min_pax defaults, package pricing and recommendation behavior.
- Update legacy-parity tests only where the user explicitly changed policy;
  preserve independent checks of totals, WhatsApp text and package relations.
- Check all published records for missing/invalid final prices before proceeding. No invented
  price, translation or ID. Compare representative cards/details in both
  languages/mobile/desktop; run all relevant tests, Astro check and build.

## 2. Inventory and design schema/RLS (SQL for user review)

Actual Sheets endpoints live in `src/shared/config/data-sources.ts`:
Trips_Prices (gid 0), Packages (457429210), Trip_Addons (468088862),
Global_Settings (1501122855). Inspect fresh data, not assumed counts.
Current code also joins local translated content and local Astro image maps.
Those are not all in Sheets and must not be lost or fabricated during import.

First migration scope replaces the four Sheets sources. Keep existing local
translation dictionaries/images and URLs as they are; moving editorial content
or binaries to Supabase is a separate task, not required to remove Sheets.

Proposed tables, finalized after inventory:

| Table | Purpose |
| --- | --- |
| trips | Existing text ID, unique slug, single prices, minimum pax, location/category, flags, source order and existing badge fields |
| packages | Existing text ID, unique slug in package namespace, single prices, minimum pax, location/category, flags and source order |
| package_trips | Package/trip foreign keys and explicit itinerary order; no comma-separated IDs |
| trip_addons | Existing addon/trip IDs, single price, current IT/EN labels, active flag and source order; key shape follows real uniqueness |
| public_settings | Allowlisted public promo settings only, current IT/EN values, active flag and preserved date fields |

Use exact decimal amounts (numeric, not floating point), nonnegative price
checks, NOT NULL for required fields, PK/unique/FK constraints, positive integer
min_pax, indexes for foreign keys and deterministic order. IDs stay separate
from slugs; route namespaces permit the same slug across trips and packages.
No discount columns. Retain source CSV snapshots privately for rollback/audit,
not as public raw JSON columns containing unrelated fields.

SQL must explicitly enable RLS and grant only required SELECT to anon, with
publication predicates on parent and child tables. Revoke anonymous writes.
RLS and table/column grants are separate: both must be reviewed and tested.
Inactive rows, unpublished package membership and private settings must not
leak. No views or privileged functions unless a demonstrated need is reviewed.
Verify public select succeeds and denied writes/private reads remain denied;
use read-only policy inspection plus rollback-safe probes on disposable test
records under separate authorization, never mutate real catalog data to test.

## 3. Export and user-run import

Generate normalized CSVs and a manifest from a fresh Sheets snapshot. Preserve
IDs, slugs, prices, booleans, membership order, flags, badges, labels and settings.
Report row counts, checksums, blank-child conversions and every rejected field.
Reject duplicate IDs/slugs, orphan relations, missing local IT/EN content and
missing image associations before producing an accepted import.

User runs reviewed SQL, then imports parents before package_trips/addons.
An optional one-off script is user-run; no service_role/secret key is sent to
the agent, conversation, repo or build. No privileged key is needed for CSV
dashboard import. Avoid repeated imports without a documented duplicate-safe
procedure. Verify imported counts and every mapped value read-only.

## 4. Add Supabase provider without changing presentation

Keep getTrips/getPackages/getAddons/getGlobalSettings as feature entry points.
Add provider mapping and explicit selection centrally in the data layer;
adapt the build-validation hook too (it currently resets/logs Sheets directly).
Domain consumes normalized models, never Supabase/network/environment APIs.
Preserve existing source-derived behavior explicitly while removing dependence
on provider-specific raw fields; do not fake p_* fields to satisfy old tests.

Prefer native fetch to the REST API for this small build-time read integration;
no SDK dependency is assumed approved. Read with a publishable key configured
via environment. It is public by design, but keep configuration out of tracked
source for environment portability. Never require service_role or secret keys.
No browser database client, direct DB password or new Auth system is needed.

Use deterministic ordering, complete pagination, timeouts and clear errors.
Run both providers against the same snapshot and compare normalized catalogs,
membership, prices, page counts and generated visible content. Build failure
must expose the record/field safely, never tokens. Do not silently mix providers.

## 5. Verify and switch the test build

Run domain/booking/WhatsApp tests, `npx astro check`, `npm run build`, catalog,
link, sharing, language and SEO verifiers. Recheck cards/details in IT/EN on
mobile/desktop and actual deployed HTTP 404/noindex/image behavior.
Compare all migrated prices and relations; spot checks alone are insufficient.
Keep original production untouched. User approves environment switch/redeploy.
Retain an explicit provider toggle for rollback, never automatic fallback.

Astro output is static: changing a Supabase price does not update a published
page until the site rebuilds. Start with manual rebuild; a webhook/button is
later work. Keep test noindex and production canonical separation intact.

## Deferred

Automatic rebuild hooks, Auth, favorites, emails, lead-storage migration,
editorial CMS/image storage, redesign and production cutover are separate tasks.
Do not conflate importing catalog data with welcome/offerta form delivery.

## References

- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/postgres/row-level-security
