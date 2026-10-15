# Existing Sheets catalog — import completed

Applied to **fabioEgypt** (`iiivnvwspoikfrlclhyr`) on 2026-10-15 after explicit
user authorization. Migration `20261015025613_create_existing_sheets_catalog`
created the five tables; the reviewed catalog was imported atomically with an
empty-table guard. All fields of all imported rows match the reviewed CSVs.
See `../qa/supabase/remote-import.json` for actual grants, public counts and
security advisor results. The Astro data layer now defaults to Supabase; the
live publishable-key integration and static-output checks are recorded in
`../qa/supabase/provider-verification.json`. Hosting deployment is separate.

This is the existing catalog only. It adds no Auth, leads, CMS, price history,
destination/category management, application server, runtime API or deployment.
The static GitHub Pages architecture reads Supabase during future Astro builds.

## Reviewed shape and data

| File/table | Rows | Publication |
| --- | ---: | --- |
| `import/trips.csv` | 27 | 22 active; 5 existing inactive dummy records retained but hidden |
| `import/packages.csv` | 14 | All active |
| `import/package_trips.csv` | 20 | Existing membership lists split into ordered relationships |
| `import/trip_addons.csv` | 3 | Existing active trip addons |
| `import/public_settings.csv` | 1 | Existing promo banner only |

Only `adult_price` and `child_price` are stored. Nonblank d is final; blank d
selects p; explicit zero wins. Both child inputs blank -> zero. Missing adult
inputs or invalid selected prices fail export. Prices use `numeric(12,2)`;
the exporter rejects rounding/overflow before producing an accepted manifest.

Stable IDs, slugs, order, minimum pax, categories, locations, booleans, badges,
addon IT/EN labels and package membership are preserved. HOT_DEAL is retained as
source catalog metadata but the approved presentation no longer displays it.
Local translations and image binaries remain local and are validated for every
published offer; moving them into Supabase is outside this task.

73 inactive trip rows and 85 inactive package rows without IDs are spreadsheet
placeholders, not catalog records. They are counted and remain in ignored raw
snapshots. The source `whatsapp_number` setting is excluded from the promo-only
table; public contact configuration remains under `src/shared/config/site.ts`.
Original promo date strings are preserved as optional text, without date gating.

## Historical manual import procedure — do not repeat on this database

The authorized agent execution is complete. The steps below document the
original empty-database procedure; do not rerun schema SQL or CSV imports on
the current populated database.

1. Review `schema.sql`, all five CSVs and `import/manifest.json`. Confirm the
   project above and that these five public catalog tables do not already exist.
2. Run `schema.sql` in that project's SQL Editor. It creates the five tables,
   constraints, foreign keys, required FK index, RLS and SELECT-only anon grants
   in one transaction. It deliberately fails on pre-existing table names instead
   of overwriting data or masking a conflicting schema.
3. In Table Editor, import each CSV into its matching table. Import parents first:
   `trips`, `packages`; then `package_trips`, `trip_addons`, `public_settings`.
   Map columns by their header names, including `source_order` and `position`.
   Optional badge/date blanks may be empty strings or NULL; their catalog meaning
   is blank. Required IDs, prices, labels and booleans must never be NULL.
4. Run `verify-after-import.sql`. Owner counts must be 27/14/20/3/1; anon-visible
   counts must be 22/14/20/3/1. RLS must be on, anon SELECT allowed, anonymous
   writes denied, authenticated table access absent, and leak counts zero.
5. Tell the agent import is complete for a read-only comparison of every value
   and relation, plus Data API validation with a publishable key. No privileged
   key or database password is needed or should be shared.

Do not repeat the CSV import into populated tables. PK/unique constraints reject
duplicates; they do not turn a repeated import into a safe refresh. If an import
fails or is partial, inspect counts/IDs first, then prepare a reviewed correction
for the missing rows. Do not truncate, delete or reapply the schema as a retry.
Only switch the website's provider after full validation; deployment remains
separately approved. Changes in database prices need a successful site rebuild.

## Access review

All five exposed tables explicitly enable RLS. Supabase's inherited public,
anon and authenticated table privileges are revoked for these tables only;
anon receives SELECT. There are no public write policies. Parent rows require
`is_active`; membership requires both active parents; addons require their own
active flag and an active trip; settings are restricted to active `promo_banner`.
No functions, views, extensions or global default-privilege changes are created.

SQL was reviewed locally against the official [API grants/RLS guidance](https://supabase.com/docs/guides/api/securing-your-api)
and [RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).
Schema execution, every imported field, anon-visible row counts and table
grants have been verified through MCP. The supplied verification script remains
read-only. Publishable-key Data API reads and the Supabase provider also pass full catalog
and build-output comparison. Actual
denied-write probes on disposable rows require separate authorization and are
not included. Advisors reported EXECUTE warnings for the existing
`public.rls_auto_enable()` event-trigger function, outside the five-table changes;
no function was created or modified by this migration.

## Reproduce preparation

From `astro-site/` with pinned Node and network access:

```sh
node scripts/audit-sheets-for-supabase.mjs
node scripts/export-supabase-catalog.mjs
node --test src/shared/data/__tests__/catalog-import.test.mjs
npx astro check
npm run build
```

The audit captures fresh CSVs in ignored `supabase/local/`. Export checks their
SHA-256 hashes, validates the entire published catalog including assets and
translations, validates all imported IDs/relationships/constraints, round-trips
every CSV field and writes a review manifest with schema/file checksums.
CSV Git attributes retain LF endings so checksums survive fresh checkouts.
An export failure removes the accepted manifest; do not import without one.
Raw snapshots are local migration evidence, never public API columns or build
output. No credentials are read by these preparation scripts.

## Active build-time provider

The feature entry points getTrips/getPackages/getAddons/getGlobalSettings keep
serving the same domain models. Provider choice belongs to shared/data/provider.mjs.
Supabase is the default. The REST adapter uses explicit column selection,
deterministic ordering, exact-count pagination, timeouts and per-build request
caching. Invalid/missing data or failed requests stop the build; Sheets is never
selected automatically. No Supabase SDK, browser database code or server adapter
was installed. Local content dictionaries and Astro images remain unchanged.

Local public catalog settings are stored only in ignored .env.catalog. Copy
.env.example for a fresh checkout; run builds from astro-site/. The supported
variables are CATALOG_PROVIDER, CATALOG_SUPABASE_URL and
CATALOG_SUPABASE_PUBLISHABLE_KEY. Build-host environment variables take precedence.
Only an enabled modern sb_publishable_ key is accepted. No key is embedded into
HTML or browser bundles. Never configure service_role, sb_secret_ or a database
password. Explicit rollback selects CATALOG_PROVIDER=sheets and requires a fresh
build; it does not alter imported database records.

The normal production artifact remains dist/. An isolated local test artifact
was generated under ignored supabase/local/test-dist/ with noindex and its own
localhost asset origin. The loopback QA server is temporary test tooling, not an
application server or hosting plan. No remote build variables, deployments,
custom domains, lead delivery or rebuild hooks were changed.

Advisor follow-up remains separate: the existing event-trigger function
public.rls_auto_enable() has default EXECUTE grants reported for
[anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
and [authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
Its result type is event_trigger; no exploit or RPC execution was attempted.
It was not created by this migration. A separately approved change can tighten
those function grants; table SELECT/RLS and denied table-write privileges have
already been verified independently.
