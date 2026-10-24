# Durable favorite activity — local preparation, 2026-10-25

The approved timer is 24 hours after the later of consent and the last actual
addition. Removing the newest favorite must not rewind to an older surviving
row's timestamp. Emptying the list cancels waiting; refilling starts it again.
Tour/package duplicate saves do not restart it. One accepted reminder consumes
eligibility; the durable acceptance ledger is still future work.

## What exists

- Pure activity validation and a count-based scheduling entry point sharing the
  existing policy. No browser timestamps or database dependencies in domain code.
- Backend-only injected RPC reader: validates rows, distinguishes missing history
  from failures, and uses a deadline. It is not called by the website or a worker.
- `../../supabase/reminder-activity/schema.sql`: local trigger/backfill proposal.
  After bootstrap, each actual INSERT/DELETE updates one private per-account
  summary row, without recounting both tables. Source RLS still governs saves.
- `role-tests.sql`: unexecuted two-account disposable fixtures with ROLLBACK.

## Actual local checks

- Node activity repository tests: **4 passed, 0 failed**.
- Vitest activity and existing schedule suites: **2 files, 13 tests passed**.
- Astro check: **350 files, 0 errors, 0 warnings, 0 hints**.
- Static build: **94 pages, complete in 10.81s** using read-only public catalog.
- Final full regression run: **244 Node tests and 19 Vitest files / 158 tests
  passed**, no failures.

These results do not prove PostgreSQL parsing, trigger runtime permissions,
RLS, lock ordering, latency or concurrent behavior. SQL has not been executed;
no local PostgreSQL installation was added. No real data or email was changed.

## Remaining review and activation

Installation takes bounded maintenance locks and refuses enabled consent or
future source timestamps. Its surviving-row baseline is valid only while all
consent is off: the next grant then occurs after historical additions. It cannot
reconstruct previously deleted addition history for an active reminder system.

Review SQL and definer ownership/grants, approve a maintenance window and
disposable role tests, then verify real concurrent tour/package changes, rollback,
Auth cascade/deadlock handling and write latency. Source IDs/timestamps are not
an alternative browser API for this private summary. Administrative UPDATE or
TRUNCATE needs a separately reviewed repair procedure.

Before sending: implement bounded joined due batches, durable one-message
identity/acceptance ledger, leases, uncertain-result reconciliation, quota policy,
suppression and unsubscribe. Agree operational budget and retention/deletion
rules. Keep Cron, opt-in and public sending off until these gates pass.
