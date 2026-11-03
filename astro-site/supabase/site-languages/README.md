# Spanish and European Portuguese account language support

User-requested extension of the existing site language set, 2026-11-02.
`schema.sql` changes only the existing locale allowlists from IT/EN to
IT/EN/ES/PT. `pt` denotes European Portuguese in the shared site configuration.

Reviewed against the actual current function definitions before application:

- Eight locale constraints, including signup intent and consent-audit language.
- Eight existing function definitions. Only the literal language allowlist is
  expanded. CREATE OR REPLACE preserves current owners and EXECUTE grants.
- RLS, role permissions, verified-account checks, lock/revision handling,
  consent state, timing, quotas and restricted reminder recipients are retained.
- The IT/EN-only disposable reminder-test ledger and its RPC are excluded.
  This change does not authorize a wider test window or any real email test.

Before use, verify ES/PT profile updates, stale-command rejection, withdrawal
and signup intention versus verified consent in a disposable ROLLBACK transaction.
No real users are modified by that verification.

Rollback: before ES/PT account state exists, restore `previous-functions.sql`
and narrow the eight language constraints back to IT/EN. Once ES/PT state exists,
keep the additive database support and roll back the site release instead;
never delete or rewrite customer language/consent records to force a downgrade.

Operational state and real verification results belong in `VERIFICATION.md`.
