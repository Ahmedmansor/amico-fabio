# Existing Sheets catalog import — ready for user review

Prepared for **fabioEgypt** (`iiivnvwspoikfrlclhyr`). No SQL or data has been
applied remotely. Read-only MCP inspection on 2026-10-15 still returned
`{"tables":[]}` for `public`. The live site remains on its existing provider.

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

## Apply in Supabase (user-run, once)

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
SQL execution, live RLS enforcement, Data API access and import success have
**not** been verified; they require the user-run schema/import above. The supplied
verification script is read-only. Actual denied-write probes on disposable rows
would require separate authorization and are not included in these results.

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
