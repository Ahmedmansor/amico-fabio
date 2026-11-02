# Proposed native overlap check — approval required

Not executed. Automatic approval review rejected this method. No workaround is
authorized by this document. The schema and rollback role checks are already
applied/passed; public activation is OFF.

Concrete proposed operation, only on fabioEgypt:

1. Generate a fresh UUID and verify it is absent. Insert one confirmed disposable
   `auth.users` row with exact email `qa-marketing-race-<UUID>@example.invalid`,
   no password/identity/mail API, empty metadata. Existing onboarding INSERT
   trigger creates its matching row. Commit only this fixture.
2. Create one uniquely named `qa_marketing_race_<UUID>` pg_cron job, interval
   `1 second`. Its first transaction unschedules its own exact job name and
   commits, before any test work, so a later assertion failure cannot reschedule
   it. Its second transaction sets a distinct application_name and test JWT
   claims, switches to authenticated, calls the existing consent RPC at revision
   0 with enabled=true, holds the transaction for 15 seconds, then commits.
3. Read pg_stat_activity and pg_locks to confirm that exact job backend holds the
   advisory lock during PgSleep. Through the ordinary SQL connector, attempt
   enabled=false with expected revision 0 as the same synthetic account. Expect
   real lock wait followed by SQLSTATE 40001 after the first transaction commits.
   Record timing, one revision and one audit event. Do not use real accounts.
4. In cleanup (also on any failure), unschedule only the exact job if present;
   cancel only its exact application_name backend if still running; delete only
   the fixture matching BOTH fresh UUID and exact invalid-domain test email.
   Verify users/onboarding return to baseline, marketing fixture rows cascade
   away and no matching job/backend remains. Never change other cron jobs.

This requires a briefly committed synthetic Auth/consent fixture and temporary
privileged server automation, which is precisely why auto-review rejected it.
No email, real user change, recipient expansion, paid dependency or schema change
is proposed. A genuinely separate authorized SQL session can instead perform the
same overlapping transactions without a cron job; the current connector calls
did not establish actual overlap. Do not equate sequential stale-write assertions
with simultaneous transaction evidence.
