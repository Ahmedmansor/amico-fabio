# Account synchronization activation — 2026-10-24

Project: fabioEgypt (`iiivnvwspoikfrlclhyr`). No hosting changes or deployment.

## Authorization and executed scope

User requested real synchronization activation, then explicitly approved two
disposable Auth identities without emails and unpublished catalog fixtures in a
rollback-only role test. Automatic review initially rejected the role test until
that separate approval arrived; it subsequently executed successfully.

Applied the reviewed schema.sql once: profiles, wishlists, package_wishlists;
ownership RLS; minimal authenticated column inserts and own-list deletes;
profile locale-only updates; authenticated published trips/packages(id,is_active)
lookup grants. Existing anon catalog access and ensure_rls remain unchanged.

## Real evidence

- Preflight: all three user tables absent; both catalog IDs text and is_active
  boolean; authenticated had no catalog grants; no noninternal auth.users
  triggers and id its sole required column without a default.
- Post-apply metadata: RLS enabled on all three tables, nine ownership policies,
  expected FK/PK/locale constraints and secondary catalog-FK indexes. No anon or
  PUBLIC table grants; no client timestamp insert/update permissions.
- Executed role-tests.sql. Actual returned result:

  `passed: own CRUD, cross-account and anonymous denial, published items, timestamps, deduplication and cascades; transaction will roll back`

- Cleanup read: temporary_tours_remaining=0, temporary_packages_remaining=0;
  catalog totals 27 tours / 14 packages; ensure_rls enabled (`O`). No real
  customers or published catalog records were modified by the fixture tests.
- Security advisor: only auth_leaked_password_protection WARN; no RLS/table
  findings. Password login is not part of the current Google-only UI; no Auth
  setting was changed as part of synchronization.
- Local ignored .env.local sync flag set to 1; other settings preserved.
- verify-live-anonymous.mjs read public configuration from 4322. Actual output:

  `profiles: anonymous REST access denied (401).`

  `wishlists: anonymous REST access denied (401).`

  `package_wishlists: anonymous REST access denied (401).`

  `Live wishlist config enabled for tours and packages; real anonymous REST denials passed.`

No keys, session tokens, passwords or customer rows were printed. Browser
inventory exposed no existing signed-in user tab; no user session was extracted.

## Remaining user browser check

Use http://127.0.0.1:4322 on this computer. After Google sign-in, verify the
wishlist says favorites are saved to the account. Save a tour and package,
refresh, then sign into the same account in a separate browser/profile on the
same origin and confirm both restore. Remove one and focus/refresh the other
browser to confirm the saved server state. Different accounts must remain
isolated. This end-to-end user-session check is pending, not agent-verified.

Guest revisions are acknowledged only after remote readback. Signout preserves
unsynchronized local entries. Git defaults and hosting remain off; this local
activation does not publish a site or enable Brevo/reminder services.

Application checks: npx astro check — Result (252 files), 0 errors, 0 warnings,
0 hints. npm run build — 94 pages in 8.42s, Complete! Enabled bootstrap verified
in the generated output on six main-site routes. These build checks do not
replace the authenticated browser check above.

User follow-up, 2026-10-24: the user confirmed real synchronization works,
including cross-browser restoration/removal and deduplication on login. This
completes the previously pending manual check as user-reported evidence; no
user session/token was extracted by the agent.
