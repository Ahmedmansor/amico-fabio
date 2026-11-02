# Production and test flavors

## Responsive Fabio/video polish and inquiry resilience — 2026-11-02

Migration source `54594ab382921b9547c98558c7569a358eff21d8`, including the focused
inquiry fix `f3da441`, is Ready on existing test project `amico-fabio-test`.
Deployment: `https://amico-fabio-test-bncr4aot4-fabio-landing-pages.vercel.app`;
stable alias `https://amico-fabio-iyzo.vercel.app` unchanged. No environment,
provider, catalog or publication flag changed. Dummy blogs stay visible/noindex.

Square uncropped Vimeo thumbnails, original-content biography dialog, explicit
mobile CSS/touch portrait movement and conditional desktop/iPad card reveals
passed seven local and seven deployed Chromium cases. Cairo stepper fix passed
eight development/static cases with optional analytics blocked. Astro check:
595 files without diagnostics; static build 171 pages complete. Deployed mobile
Lighthouse: 99 performance/100 accessibility, LCP 2.2s, TBT 0ms, CLS .001 (single
lab run). See `qa/home-refresh/POLISH_REVIEW.md`, `polish-deployed.json` and
`polish-performance.json`; inquiry root cause is in `qa/inquiry/STEPPER_FIX.md`.

## Restore the owner's demo content — 2026-11-02

The owner reported that their dummy blog articles disappeared after deployment.
No content files were deleted: all 12 design demo posts (six IT/six EN) and their
assets remained committed with fixture/demo markers. The prior remote build
excluded them because BLOG_INCLUDE_FIXTURES was off/absent, while local visual
builds explicitly set it to 1. Keeping it off on the user's test preview was the
wrong preview configuration for their expected review content.

Set BLOG_INCLUDE_FIXTURES=1 only on existing `amico-fabio-test` Production and
Preview, preserving PUBLIC_NOINDEX=1. Do not unset fixture markers or change
production publication rules. This also restores the guarded destination-guide
preview pages such as Aswan. Local checks: 588 files, 0 errors/warnings/hints;
build 171 pages complete, 70 editorial link checks and 50 structured-data contract
checks passed. The noindex/empty-sitemap guard remains enforced. Run
`qa/blog/verify-demo-restoration.mjs` after the matching deployment to verify
existing articles in both listings, HTTP 200, guides and an empty sitemap.

Verified deployment `amico-fabio-test-eyab2mnqh-fabio-landing-pages.vercel.app`
Ready (27s build), source `53952b7b20528bed5b55fdaa65c17245680ca065`, stable alias
unchanged. All 12 demo article URLs returned 200/noindex and appeared in their
IT/EN listings; both Aswan guides returned 200 with the shared inquiry widget;
the sitemap remained empty. See `qa/blog/demo-restoration.json`. No content,
translation, images or publication markers were edited to restore visibility.

## Offers-consent activation — 2026-11-02

User explicitly approved the temporary native overlap test. Real lock contention
passed (12.284765s wait then stale revision rejection), one write/audit event,
and cleanup restored all fixture counts to baseline. Public marketing consent
flag set to 1 only in Production/Preview of `amico-fabio-test`
(`prj_wnFBSYAhpMxQy2ltJQIi8gvxqd6I`). No other hosting variables or providers changed.

Pushed `78b6ca5ad00eb740f9ef7b3828da33e4f2218c8e`; deployment
`https://amico-fabio-test-k3ifdifpg-fabio-landing-pages.vercel.app` is Ready
(16s build), with stable alias `https://amico-fabio-iyzo.vercel.app`.
IT/EN login and wishlist returned 200/noindex with enabled consent markup,
preserved Google/password flags and the correct Auth origin. Four real deployed
guest-browser cases (375/1280px, both languages) passed: signup card/portrait,
unchecked optional input, native keyboard toggling, no horizontal overflow,
zero Auth-send POSTs. Anonymous live RPC returned 401. See
`qa/auth/marketing-activation-deployment.json`.

Authenticated native SQL grant/withdrawal/concurrency and synthetic browser
grant/withdrawal are verified separately. Real-user Google/email registration,
account-browser saving/withdrawal and inbox acceptance remain the user's final
check. No real mail, promotional sender or reminder-recipient expansion was
introduced. Committed defaults and ignored local env files remain unchanged.
Rollback: set only this test project's marketing flag back to 0 and rebuild;
preserve consent/audit evidence. Legacy main/domain/production project unchanged.

## UI refactor test deployment — 2026-11-02

Pushed migration commit `83a3123deb11960d60c7757c7e87bdf4bedcf330` on
`try-to-refactoring-to-astro`. Verified existing project `amico-fabio-test`,
root `astro-site`, ID `prj_wnFBSYAhpMxQy2ltJQIi8gvxqd6I`. Git integration built
deployment `https://amico-fabio-test-lskr7a2il-fabio-landing-pages.vercel.app`,
status Ready, build duration 29s; stable alias remains
`https://amico-fabio-iyzo.vercel.app`. No hosting environment settings were changed.

Ten public IT/EN checks passed across home, wishlist, planner, tour and login:
HTTP 200, noindex, current UI markers, Google/password flags and matching stable
Auth origin. Promotional consent remains off pending native overlapping-write
verification. Backend schema/role assertions are recorded separately in
`supabase/marketing-consent/VERIFICATION.md`. No real login, email or consent
grant was generated by deployment checks. Legacy main/domain/project unchanged.

Aswan guide returned 404 on the deployed host: its local visual content is guarded
as a fixture and is intentionally excluded from the normal deployment. No fixture
flag or publication policy was enabled to make that route appear. The shared
nationality widget is verified on the published planner instead. Other fixture
guide/article content likewise is not claimed as published by this rollout.

Deployed mobile Lighthouse: performance 97/accessibility 100, LCP 2.3s, TBT 40ms,
CLS .001. One cold lab run, not field INP or a causal comparison with local runs.
See `qa/home-refresh/test-deployment.json` and `deployed-performance.json`.

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
