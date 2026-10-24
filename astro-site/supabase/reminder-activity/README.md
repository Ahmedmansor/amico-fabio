# Durable favorite activity — local review proposal, not applied

The approved reminder waits 24h after the later of consent activation or the
last real addition. Reconstructing that history with `max(added_at)` on remaining
rows is wrong after removing the newest item. This proposal keeps a committed
combined tour/package count, last-addition time and monotonic activity revision.
It does not create a queue, record provider acceptance, send mail or run Cron.

## Write path and private boundary

`AFTER INSERT/DELETE` row triggers update a private activity table in the same
transaction as favorites. Duplicate `ON CONFLICT DO NOTHING` inserts create no
row event. Removing an item preserves the latest addition unless the combined
count becomes zero; refilling records a fresh server time. Row revisions fence
future content/claim races. Rollback also rolls back activity. Auth deletion
cascades rather than recreating state. Existing source RLS remains the owner
check; neither browser grants nor service-role catalog/wishlist grants widen.
After the coherent baseline, each real row event increments/decrements one private
row; it does not recount both favorite tables for every save. Missing/negative
state fails the transaction for review rather than silently guessing history.

The trigger is narrowly scoped `SECURITY DEFINER` in a new, unexposed schema:
its legitimate purpose is writing a table that callers cannot write. It has an
empty search path, fixed source tables/operations, no arguments/dynamic SQL and
no public/browser/service EXECUTE grant. The public read RPC is INVOKER and
service-only; service gets read-only private columns. No browser endpoint is
introduced. Review this definer/trigger boundary before any remote execution.

The trigger shares the existing per-account transaction advisory key. Its
VOLATILE queries can see committed changes after waiting. Actual overlapping
favorite/consent/deletion traffic still needs database concurrency/load testing;
sequential fixtures are not that evidence. Deadlock/transient-error behavior,
write latency and Auth cascade handling must be checked before activation.
Administrative UPDATE/TRUNCATE of favorites is outside the current app/grants;
do not use those operations without an explicit activity maintenance plan.

## Conservative bootstrap and maintenance gate

`schema.sql` takes short, ordered Auth/favorite/consent table locks and uses 3s
lock / 30s statement deadlines. Writes may briefly wait. Apply only in a reviewed
maintenance window; never automatically during this local work. It refuses
existing enabled consent or future favorite timestamps. This matters: historical
removed additions cannot be reconstructed. With all consent off, the next grant
occurs after bootstrap and dominates every historical addition, so the surviving
rows provide a safe initial baseline. This is not a migration strategy for an
already running reminder system. Existing schemas/capture triggers cause CREATE
to fail rather than being silently overwritten.

`role-tests.sql` is **not run**. It proposes two random Auth IDs without emails,
references one existing published tour/package (no catalog changes), and tests
duplicates, newest removal, empty/refill, timestamps/revisions, private grants,
rollback, account isolation, locale/consent independence and Auth cascades before
ROLLBACK. Approve schema and fixtures separately before executing them. CLI and
Postgres are not installed locally; these are review sources, not a fabricated
CLI migration or proof of PostgreSQL parsing.

## Local implementation and remaining work

The injected backend reader maps one private-RPC row strictly; it never falls
back to remaining-row timestamps. The pure count-based scheduling entry shares
the existing timing policy, avoiding item loads before eligibility is known.
Neither is mounted or activated. Local synthetic tests do not verify SQL/RLS.

Recorded time is trusted trigger-event time, visible only after commit; it is not
a separately measured COMMIT timestamp. Long administrative transactions,
concurrent changes and account deletion need native testing before activation.
The diagnostic reader is not a per-recipient dispatcher: future due selection
must use bounded joined batches rather than one activity query per account.

Next: reviewed capture activation/role/concurrency checks, bounded joined due
batches, durable one-message identity/acceptance ledger, leases, quota policy,
suppression/unsubscribe and a disabled dispatcher. Unknown provider outcomes
must be quarantined/reconciled; never restart a fresh job after an uncertain
send. Operational budgets, suppression/deletion policy and public activation
remain explicit release decisions.

Sources: [Postgres trigger behavior](https://www.postgresql.org/docs/current/trigger-definition.html),
[volatility and snapshots](https://www.postgresql.org/docs/current/xfunc-volatility.html),
[Supabase database functions](https://supabase.com/docs/guides/database/functions).
