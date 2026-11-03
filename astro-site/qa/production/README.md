# Production cutover — 2026-11-03

## Current state: live publication verified

`https://fabioegypt.com` serves Astro artifact `f8355f7`, built from source
`75ceba8`. At the user's request to continue despite the custom-workflow lock,
the local production build was published to the existing `gh-pages` source.
Managed [Pages run 41570779052](https://github.com/Ahmedmansor/amico-fabio/actions/runs/41570779052)
succeeded. `/release.json` returns 200 with the expected source. No DNS,
Pages-source, hosting or billing setting was changed.

All 1,386 copied files matched the reviewed build byte-for-byte. `.nojekyll`
preserves `_astro/` assets in branch publishing; `release.json` records public
release provenance. Generated whitespace was preserved, with only whitespace
diagnostics excluded from the artifact diff check. Source diff checks passed.
The remote tag `legacy-pages-before-astro-2026-11-03` preserves the old artifact.

`node qa/production/verify-live.mjs` passed 19 public page checks across five
languages, 230 sitemap URLs, eight sampled assets, the currency menu without its
notice, and an unknown-route HTTP 404. See `live.json` and `publication.json`.
This is public HTTP/artifact evidence, not personal login or inbox testing.
The campaign probe uses their existing `<h1>` structure; the initial generic
`<main>` assumption was corrected without changing a page.

The custom workflow's account lock still limits automatic source rebuilds.
Keep Pages on the existing branch source. To publish future changes while it
remains, build using the reviewed production workflow environment, run
`scripts/verify-production.mjs`, copy only `dist/` into an isolated checkout of
current `origin/gh-pages`, retain CNAME and `.nojekyll`, record the source,
commit and push normally, then verify managed Pages and the real domain.
Switch to GitHub Actions only when its custom build can execute successfully.
Main source reconciliation follows this publication report.

For artifact rollback, revert the artifact replacement on `gh-pages` (or commit
the rollback tag's tree as a new descendant), push normally and verify Pages.
Do not force-push or delete release history.

## Earlier preparation checkpoint

The owner explicitly authorized the migration branch merge into `main` and
publishing Astro on `https://fabioegypt.com`. This extends the earlier test-only
authorization. The existing GitHub Pages hosting and static architecture stay.
See `preparation.json` and `backend.json` for the actual pre-cutover evidence;
frontend publication was pending at this earlier checkpoint; see the current
live status above.

Preparation commit `a69b504` was pushed. GitHub Actions run
[41559378646](https://github.com/Ahmedmansor/amico-fabio/actions/runs/41559378646)
failed before executing any step with: “The job was not started because your
account is locked due to a billing issue.” See `github-blocker.json`. Main and
Pages publishing source remain unchanged; no production artifact was replaced.
The owner must resolve the GitHub account lock, then rerun the branch workflow.
Only after a successful build should Pages switch to GitHub Actions and the
migration merge into main. The separate Vercel test project remains unchanged.

## Release configuration

`.github/workflows/astro-pages.yml` installs only `astro-site/package-lock.json`
with Node `astro-site/.nvmrc` (24.21.0), runs Astro check and build, then validates
the final artifact with `node scripts/verify-production.mjs`. Pushes to the
migration branch and same-repository pull requests validate without deployment.
Only `main` can deploy through the `github-pages` environment. All five official
GitHub Actions are pinned to their verified release commit SHAs.

Repository variable `ASTRO_PUBLIC_BUILD_CONFIG` holds JSON with three separately
named public build values: `catalogKey`, `authKey`, and `turnstileSiteKey`.
These come from the existing reviewed local configuration. No privileged key,
GitHub token, CAPTCHA secret or mail credential is needed in the workflow.
Catalog settings are read only at build time. Auth uses its explicit public
configuration, with origin fixed to the real domain. Keys are not logged by
the release checks. There is no implicit provider fallback.

Production explicitly disables noindex, blog fixtures and the one-off email
test control. It preserves Google, email/password/OTP, account favorites,
locale/onboarding and the separate existing consent UIs. Consent UI activation
does not enable a promotional sender or widen the restricted reminder scope.
Utility pages keep their existing indexing rules; the sitemap contains 230
indexable pages. Preview-only demo articles remain outside the production build.

## Backend and rollback

Supabase Site URL changed from `http://localhost:3000` to the production origin.
Five locale-specific `/<locale>/auth/callback/**` entries were added, keeping
all four earlier local/test entries. The callback handler still validates the
exact route and return path; query parameters require the path-scoped suffix.
The Turnstile widget already permits both apex and www production hostnames;
its domains, mode and keys were not changed.

Four active Edge Functions received only the production origin in their
configuration file. Their downloaded source files, imports, authentication,
quotas, grants, secret bindings and recipient settings were preserved exactly.
Readback matched every uploaded source byte. Versions and previous versions
are in `preparation.json`. No schema/RLS changes or real emails were required.
`node qa/production/verify-backend.mjs` runs only OPTIONS, unauthenticated GETs,
and one unsigned empty email-hook request. It sends no sign-in request.

The current published `gh-pages` commit is
`70dc9d2e292d91385ffa1d55eb1a5b0537a893e3`; legacy `main` is
`4cabc408c2a135e2076ba61d96d96912fe4f65de`. Keep these as rollback references.
Until the cutover, Pages remains on `gh-pages / (root)` with the same CNAME.
After the cutover, switching Pages back to that untouched branch restores the
legacy artifact. Reverting the launch merge stops future Astro production
deploys. To undo the backend allowance, remove only the five new callback
entries and the production origin from those four function configurations,
restore the earlier Site URL if needed, and redeploy with unchanged source,
JWT/import settings and existing secret bindings. No customer data is deleted.

## Actual verification

```text
Astro check: Result (717 files): 0 errors, 0 warnings, 0 hints.
Astro build: 248 page(s) built; Complete!
Production artifact verified: 230 indexable sitemap URLs; 5 login/wishlist languages;
321 text artifacts; correct domain, active Auth, no fixtures or private credentials.
Focused backend tests: 44 tests; 44 pass; 0 fail.
Production backend: 13 CORS/auth-denial checks passed; no email or account mutation.
```

The focused tests exposed an old negative fixture using Portuguese as an
unsupported language. It now uses unsupported French; no language policy or
application behavior changed. The first management denial probe rejected its
GET with 405 (the endpoint supports POST); the verifier now accepts this explicit
method denial alongside 400/401/403. No successful unauthenticated operation
was accepted. Existing Browserslist age notice remains.

After deployment, verify HTTP/HTML/assets, canonical/sitemap/robots, the currency
menu, guest favorites and login rendering on the real domain. Actual personal
Google/email sign-in, CAPTCHA completion, OTP inbox receipt and authenticated
cross-browser favorites remain owner tests; do not claim them from static checks.

References: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).
