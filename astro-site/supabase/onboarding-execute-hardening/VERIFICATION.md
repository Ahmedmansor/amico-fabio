# Onboarding trigger EXECUTE hardening — 2026-11-03

User authorized fixing both findings from the live security review. Project:
`fabioEgypt` (`iiivnvwspoikfrlclhyr`). Work remains on the migration branch.

## Applied and verified

Remote migration `restrict_onboarding_trigger_execute` returned
`{"success":true}`. Revoked EXECUTE from PUBLIC, anon and authenticated on
`public.handle_new_user_onboarding()`. The original schema now includes the
same restriction to prevent reintroducing it during future setup.

Before/after inspection: owner remains `postgres`, function definition MD5
remains `0882f9d6de8aff8c66e0e3371350c8d5`, and
`on_auth_user_created_onboarding` remains enabled (`O`). Both client roles now
return false from `has_function_privilege(..., 'EXECUTE')`.

Reviewed both existing Auth INSERT trigger bodies before the disposable test.
`role-tests.sql` exercised a real auth.users INSERT and onboarding creation,
then verified direct calls fail with insufficient_privilege under both anon
and authenticated. Entire test transaction rolled back. Actual output:

```json
{
  "registration_trigger_assertion": "passed before rollback",
  "anon_direct_execution": "denied",
  "authenticated_direct_execution": "denied",
  "fixture_users_remaining": 0,
  "fixture_onboarding_remaining": 0,
  "fixture_marketing_remaining": 0
}
```

Initial attempt to SET ROLE supabase_auth_admin was rejected with SQLSTATE
42501 (permission denied); that transaction made no lasting writes. The final
test uses the connected SQL role for INSERT and actual client roles for denial
tests. It verifies the database trigger, not a real browser registration or
email delivery. No email was sent and no existing account was changed.

Fresh security advisors no longer report anon_security_definer_function_executable;
handle_new_user_onboarding is also absent from authenticated function warnings.
Four intentionally authenticated account RPC warnings and 20 internal
RLS-without-policy informational findings remain outside this focused change.

## Leaked-password protection: unavailable on current plan

Live organization lookup returned `plan: free`, `tier: tier_free`; user confirmed
the Free plan. Supabase's official password-security documentation states the
built-in leaked-password check requires Pro or above:
https://supabase.com/docs/guides/auth/password-security

This setting was not enabled and its advisor warning remains. No billing change,
upgrade, custom substitute, password reset or unrelated Auth setting was made.
This is a plan limitation, not a completed password-protection activation.

## Rollback and checks

`rollback.sql` restores inherited PUBLIC EXECUTE only if emergency rollback is
needed; it intentionally restores the previous warning. Function body/owner,
triggers and table policies need no rollback because they were not changed.

Initial sandboxed `npx astro check` and `npm run build` failed with
`[Supabase:trips] Network request failed or timed out.` Network-enabled reruns
completed successfully:

```text
npx astro check
Result (718 files):
- 0 errors
- 0 warnings
- 0 hints

npm run build
[fabio-catalog-validation] Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings.
[fabio-seo] Verified canonical and reciprocal hreflang for 230 indexable pages; generated sitemap.xml and robots.txt.
[fabio-blog-guard] Checked 321 generated text files; fixture artifact policy verified.
[build] 248 page(s) built in 23.49s
[build] Complete!
```

Build emitted a nonblocking outdated caniuse-lite database notice; no dependency
was changed. `git diff --check` passed. No site deployment is needed for the
database privilege change.
