# Account wishlist schema proposal — NOT APPLIED

Prepared 2026-10-23 for fabioEgypt (`iiivnvwspoikfrlclhyr`). This is a SQL Editor
review artifact, not a migration that has been executed. No remote writes are
authorized by the earlier catalog approval or by preparing these files.

## Exact remote scope requiring approval

1. `public.profiles`: account UUID (Auth FK), preferred locale, server-created
   timestamp. No copied name, email, avatar, marketing consent or role fields.
2. `public.wishlists`: account UUID, existing stable tour ID, server-added
   timestamp. Composite primary key prevents duplicates. Auth account deletion
   cascades these rows; catalog deletion is restricted while referenced.
3. Ownership RLS plus minimal authenticated grants on these two tables. Anonymous
   users have no read/write permissions. Clients cannot alter timestamps or
   transfer rows to a different account. No privileged functions, signup triggers,
   hooks, Cron, emails or changes to Auth providers/SMTP.
4. Narrow additional `authenticated` SELECT on `trips(id,is_active)` and a
   published-only SELECT policy. The wishlist INSERT policy needs this lookup
   because existing catalog grants/policies allow only `anon`. This does not
   grant prices or other catalog columns and leaves existing anon access intact.

The SQL has one transaction and deliberately has no IF NOT EXISTS/replace clauses
that could hide an unexpected schema. Recheck preflight before applying.
The locale CHECK mirrors the current shared language configuration (it/en);
adding a supported language later requires a reviewed constraint update.

## Read-only preflight observed

Metadata reads on 2026-10-23 confirmed:

- profiles and wishlists do not exist in public.
- trips.id is text; anon has SELECT, authenticated has neither table SELECT nor
  id-column SELECT. The only trips policy is anon/is_active SELECT.
- Existing rls_auto_enable/ensure_rls remains enabled; its body, owner and grants
  must stay unchanged. Explicit RLS in this script does not replace that trigger.

No customer/account records or secrets were read. No SQL in schema.sql was run.
No PostgreSQL/psql runtime was available through the configured local toolchain,
so syntax, grants and RLS behavior
have not been executed against PostgreSQL. Review and real role-isolation tests
remain required; Astro build/check do not validate this SQL.

## Intended data contract

- Read own wishlist using an explicit user_id filter as well as ownership RLS.
- Add missing tours with ON CONFLICT (user_id,trip_id) DO NOTHING; no UPDATE
  grant is needed and existing added_at is not reset. Read back the account list
  before acknowledging the merge. Explicit user removals are separate DELETEs.
- Keep account preferences separate from Google profile display metadata.
  Create the minimal locale row lazily, not with a trigger that could block signup.
- Preserve saved inactive tours for their owner; only additions require an active
  tour. Page rendering resolves IDs against the published static catalog and
  reports unavailable records rather than inventing content.
- Missing schema/network errors must produce an honest failure, never silent
  fallback claiming account synchronization succeeded.

## Lossless guest merge requirements

Capture the account identity/generation and a per-item guest revision snapshot.
Insert the snapshot's eligible items without replacing the account list, then
read back confirmed IDs. Clear only confirmed snapshot items whose local
revision still matches, and only while the same authenticated account/generation
remains current. Leave failed, removed/unpublished, newly added or re-added local
items untouched. A v1 value of `1` cannot identify a remove/re-add race: the local
implementation must introduce a compatible revision format before cleanup is
activated. Never wipe localStorage or clear the entire guest list.

Do not automatically replay an interrupted merge into a different account.
Signout must not erase unsynchronized guest items or leave the prior account's
list visible. Serialize writes per account and discard stale responses. Query
all pages of a large wishlist instead of accepting the API's default row limit.

## Acceptance after authorization

Run verify.sql (metadata only), then use synthetic/disposable accounts and tours
under separate explicit test-write authorization: own read/add/delete; duplicate
insert; cross-user read/write denial; anonymous denial; timestamp and identity
updates denied; unknown/inactive tour insertion denied; duplicate merge and
partial/network failures. Do not test denial by mutating real customer records.
Inspect advisors and verify original catalog anon behavior and ensure_rls intact.
Activation stays off until SQL execution and role tests have actually succeeded.

## Prepared disposable role test — NOT RUN

`role-tests.sql` is a separate remote test-write scope requiring approval after
schema execution. It creates two synthetic Auth UUIDs without email addresses,
one unpublished synthetic trip, and disposable profile/wishlist rows in one
transaction that ends in ROLLBACK. It never substitutes or edits real users or
existing tour records. No Auth API or email send is called. It refuses to create
fixtures if Auth user triggers or required columns have changed.

Read-only metadata inspection on 2026-10-23 found no noninternal auth.users
triggers and id as its only required column without a default. Recheck those
conditions immediately before any approved test run. The script exercises own
CRUD, cross-account denial, anonymous denial, invalid/unknown/unpublished tours,
timestamp/identity write restrictions, minimal catalog column access, duplicate
insertion without resetting added_at, and account-data cascades. Its success
notice occurs before rollback, only after all assertions. If it errors, issue
ROLLBACK and inspect the failure; never COMMIT the fixtures. This artifact has
not been parsed/executed by a PostgreSQL engine and is not a passing RLS result.

The browser implementation now exists behind the disabled flag
PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED. Mocked/static-browser tests in
../../qa/wishlist/README.md do not replace these database role tests. No remote
tables/policies, Auth settings, environments or deployments were changed.

References: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Upsert](https://supabase.com/docs/reference/javascript/upsert).

Local artifact checks: npx astro check — Result (224 files): 0 errors, 0 warnings,
0 hints. npm run build — published catalog validated; 94 pages built in 5.05s;
Complete! These do not replace PostgreSQL syntax/execution/RLS tests.

Review-pack checks: Astro check (250 files) 0 errors/warnings/hints; default
static build 94 pages in 5.46s, Complete! These validate the application/artifacts,
not PostgreSQL execution. schema.sql and role-tests.sql remain NOT RUN.
