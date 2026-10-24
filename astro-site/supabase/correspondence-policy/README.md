# Correspondence policy successor — local, not applied

Source now uses `change_wishlist_email_preference_v2`; live v2 Edge still uses
the old RPC. Keep public opt-in disabled. Review/apply this proposal and upgrade
the preference function together before testing real consent. No deployment or
remote data mutation is performed by preparing these files.

- New consent events atomically record displayed consent language, selected
  correspondence language, wording version and trusted server time.
- Historical events are not backfilled with invented evidence.
- First actual opt-in initializes from the selected language; existing language
  survives later grants/withdrawals, independent of profile/site language.
- Existing follow-site rows become explicit without changing their language.
- Same-ID retries return current state and cannot re-enable after withdrawal.
- RLS/browser grants remain unchanged. Old RPC service EXECUTE is revoked so an
  outdated Edge service cannot accept a grant without the new audit fields.

Before activation: real disposable role tests and cleanup verification, native
concurrency checks, then separately reviewed Edge upgrade and user integration.
Management tokens and durable sending have separate prerequisites; this SQL
does not start reminders. Column removal is deliberately deferred.
