# Production and test flavors

## Auth test deployment — 2026-10-28

At the user's request, pushed application commit
`581f4f375722ec5def9d69d2ffa6f8c65fbaae0e` from the existing migration branch.
Verified project `amico-fabio-test` / `prj_wnFBSYAhpMxQy2ltJQIi8gvxqd6I`, root
`astro-site`, scope `fabio-landing-pages`. Deployment
`https://amico-fabio-test-5wx9ys11g-fabio-landing-pages.vercel.app` is Ready, with
stable alias `https://amico-fabio-iyzo.vercel.app`.

Added PUBLIC_AUTH_PASSWORD_ENABLED=1 and the public widget site key under
PUBLIC_AUTH_TURNSTILE_SITE_KEY to this project's Production and Preview only.
Existing Auth, catalog, locale, onboarding, consent, redirects and noindex settings
were preserved. Added the stable test hostname to the matching Managed Turnstile
widget while preserving existing domains and settings; no secrets were rotated.

Actual Vercel output: 99 static pages built in 5.04s; Build Completed in 9s;
Deployment completed; Ready. Public IT/EN login pages returned 200 and verified
password/email/Google flags, configured CAPTCHA, stable Auth origin, six OTP cells,
four visibility toggles, first/last name, repeated password, absent Azure,
noindex and language-specific canonicals. Homepage has no guest login form;
the login alias works and the noindex sitemap is empty. See
`qa/auth/vercel-2026-10-28.json`. These are build/public-artifact checks, not a new
live CAPTCHA, OAuth, inbox or account-creation test. No mail was sent by the agent.

No legacy main/domain/production project changes. Optional promotional consent
remains disabled and its SQL unapplied; reminder recipient scope is unchanged.
CLI linking files were created only inside ignored `.astro/vercel-link/`; do not
read or commit the CLI's downloaded environment file. Subsequent documentation-only
commits may rebuild the same application source without changing this baseline.

The repository uses the same Astro source with build-time configuration.
Existing production remains legacy Vite on GitHub Pages, branch `main`, domain
`fabioegypt.com`. The Astro migration branch is `try-to-refactoring-to-astro`.
Do not alter the existing Vercel project `amico-fabio`.

## Vercel test project settings

| Setting | Value |
| --- | --- |
| Project name | `fabio-astro-test` |
| Repository | `Ahmedmansor/amico-fabio` |
| Root directory | `astro-site` |
| Framework | Astro (static; no adapter needed) |
| Build command | `npm run build` |
| Install command | `npm ci` |
| Output directory | `dist` (relative to root directory) |
| Node version | 24.x; source pins exact local version in .nvmrc/engines |
| Vercel Production Branch | `try-to-refactoring-to-astro` |
| Intended Vercel hostname | `fabio-astro-test.vercel.app`, subject to availability |
| `PUBLIC_NOINDEX` | `1` for both Production and Preview environments |

Vercel's **Production** environment means the stable deployment of this test
project, not the actual Fabio production domain. Setting only Preview would
leave the test project's stable hostname unprotected. Configure the migration
branch, root directory and variable before the first build. Do not attach
`fabioegypt.com` or transfer any existing custom domain to the test project.
Do not create files linking the local checkout to `amico-fabio` through Vercel CLI.

The user subsequently supplied and opened a deployment of `amico-fabio-test`
for browser review. It is distinct from the protected existing `amico-fabio`
project; do not rename or alter either project as part of source preparation.
The original intended project name above records the initial plan. This source
task performs no Vercel environment update, Git push or deployment. The supplied
deployment must be rebuilt from the new commit to use independent social assets.

## Indexing behavior

- `PUBLIC_NOINDEX` absent/empty: normal `index, follow` on content pages.
- `PUBLIC_NOINDEX=1`: `noindex, follow` on all main and campaign content pages;
  the build validates it and emits an empty sitemap. 404 remains noindex in both.
- Any other value fails configuration rather than silently selecting a flavor.
- `VERCEL=1` without noindex fails Astro configuration. All Astro Vercel hosting
  in this architecture is test hosting. This guard does not touch the legacy app.
- `GITHUB_ACTIONS=true` with noindex fails configuration to prevent accidental
  publication of test indexing settings through a future GitHub Pages workflow.
- `robots.txt` permits crawling so a crawler can read the noindex directive.
  Do not replace this with Disallow: / and assume crawlers can read noindex.
- Canonical and hreflang remain `fabioegypt.com`. Test social page/image URLs
  use `VERCEL_URL` automatically, so each deployment serves its own assets.
  Optional `PUBLIC_SITE_URL=https://stable-test-host` overrides that origin when
  intentionally testing a stable alias. Never use the original domain for test
  assets. Production always uses `fabioegypt.com`, ignoring test-origin overrides.
- Outside Vercel, a noindex build requires PUBLIC_SITE_URL (a test HTTPS origin,
  or localhost HTTP). Missing test origin or a test origin equal to production
  fails before build. This prevents accidental fallback to legacy files.
- This is indexing control, not authentication or a guarantee that every crawler
  obeys. It does not make the test site private.

Variables are embedded in static HTML at build time. Updating a variable requires
a rebuild/redeploy; changing a Vercel variable cannot alter an existing artifact.
Never commit an environment file with PUBLIC_NOINDEX=1 as a shared default.
No new dependency was added; existing Astro/Vite facilities load the setting.

## Local verification

### Remote review — 2026-10-15

The initial read-only dashboard review confirmed the existing Astro test project is
`amico-fabio-test`, stable alias `https://amico-fabio-iyzo.vercel.app`.
Its Ready deployment is still commit `c622318`, before the single-price and
Supabase changes. Project variables show PUBLIC_SITE_URL and PUBLIC_NOINDEX,
but none of the three catalog build variables. No variable values were revealed.
The published sample tour has noindex and the production canonical, but still
displays both old and final prices. See qa/supabase/deployment-review.json.
That was the state before the user authorized the test update. After explicit
approval, the three catalog variables were added to `amico-fabio-test` for
Production and Preview, with existing `PUBLIC_NOINDEX=1` preserved for both.
Pushing commit `32dbf51` triggered a successful 10-second Production deployment;
its unique URL is `https://amico-fabio-test-4wxrf2lpz-fabio-landing-pages.vercel.app/`
and the stable test alias remains `https://amico-fabio-iyzo.vercel.app`.
English and Italian tour pages now show one €40 starting price, no crossed-out
price markup, and `noindex, follow`. The publishable key is absent from the
rendered page. The live legacy GitHub Pages site and Vercel project `amico-fabio`
were not changed. Details are in qa/supabase/deployment-review.json.

### Catalog build environment (prepared locally; hosting not changed)

Astro now reads the Supabase catalog during static builds. A future approved
deployment must configure `CATALOG_PROVIDER=supabase`, `CATALOG_SUPABASE_URL` and
`CATALOG_SUPABASE_PUBLISHABLE_KEY` on its build host. The key must be a modern
`sb_publishable_` key with the reviewed catalog SELECT/RLS permissions; never use
a privileged key. Set these separately in both Production and Preview on the
approved Astro test project while retaining `PUBLIC_NOINDEX=1`. No hosting
environment variable was changed by the catalog integration task.

Local development uses ignored `.env.catalog`; copy `.env.example` for a fresh
checkout and populate its public catalog settings. Build-host variables override
that file. Missing configuration or a failed Supabase request fails the build.
`CATALOG_PROVIDER=sheets` is an explicit rollback selection, not a fallback.
Changing a catalog record affects a deployed static page only after rebuild and
deployment. Existing legacy GitHub Pages/main remains unchanged.

From `astro-site/` in PowerShell:

```powershell
$env:PUBLIC_NOINDEX='1'
$env:PUBLIC_SITE_URL='http://127.0.0.1:4322'
npm run build
node scripts/verify-flavor.mjs --test
node scripts/verify-environment.mjs http://127.0.0.1:4322
Remove-Item Env:PUBLIC_NOINDEX
Remove-Item Env:PUBLIC_SITE_URL
npm run build
node scripts/verify-flavor.mjs
node scripts/verify-environment.mjs
npx astro check
npm test
```

The local review ran both builds and restored the normal indexable build last.
Do not copy a previously generated test `dist/` into GitHub Pages. Build fresh
from the intended production source without the test variable when production
migration is separately authorized. Current legacy production remains untouched.
