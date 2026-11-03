# Production and test flavors

## Astro is live on the production domain — 2026-11-03

Verified `https://fabioegypt.com` serves the Astro production artifact from
`gh-pages` commit `f8355f7`, built from migration source `75ceba8`. Managed Pages
run `41570779052` completed successfully. The production release marker matches
the source. All 19 public-page checks, five languages, 230 sitemap URLs, eight
sampled assets, currency menu and HTTP 404 checks passed. No real Auth, email or
booking form was submitted; personal sign-in/inbox tests remain owner checks.

At the user's request to continue, the verified local static build was pushed
to the existing `gh-pages / (root)` source. DNS, Pages settings, hosting services
and billing were unchanged. Remote tag `legacy-pages-before-astro-2026-11-03`
preserves the exact previous artifact. See `qa/production/publication.json`,
`live.json` and `README.md` for evidence and rollback.

The custom Astro workflow still has the recorded account-lock limitation.
Merging source into `main` alone does not yet rebuild the live artifact. Until
that is resolved, build and verify production locally, then explicitly update
`gh-pages`. Vercel remains the separate test environment.

## Production cutover authorized — 2026-11-03

The owner now explicitly requests merging the migration branch into `main` and
launching Astro at `https://fabioegypt.com`. This supersedes earlier test-only
restrictions for this launch. Hosting remains static GitHub Pages; Vercel stays
a separate test environment. Existing Pages currently publishes `gh-pages /`
with the production CNAME. The new `Astro production Pages` workflow prepares
an independently validated `astro-site/dist` artifact and deploys only `main`.
Preparation commit `a69b504` is pushed and verified locally. GitHub run
`41559378646` could not start any build step: the account is locked due to a
billing issue. At that checkpoint main was not merged and Pages still published
the legacy artifact. The later managed-branch publication above succeeded;
the custom-workflow error remains evidence of the automatic rebuild limitation.
See `qa/production/github-blocker.json` for the exact API annotation.
See `qa/production/README.md` and `preparation.json` for public build-variable
configuration, backend origin verification, real check outputs and rollback.
Earlier dated entries below describe the preceding test-only state.

## German main site and catalog SEO — 2026-11-03

Application `b085118` is Ready on existing `amico-fabio-test`, deployment
`dpl_EB6XtWHEAZ5sqqWJPDJF5ddrEsH8` (40s build), stable alias
https://amico-fabio-iyzo.vercel.app . German entry: `/de/`; tours, packages,
login, wishlist, planner, destination guides and six existing demo journal
stories are translated. Campaigns remain Italian-only; fixture safeguards stay.

Local Astro check: 714 files, zero diagnostics. Static noindex/demo build: 358
pages, 355 canonical/reciprocal checks, 113 editorial link/metadata checks and
83 editorial JSON-LD checks. All 180 catalog pages passed price/content/schema
verification. Browser tests: 24 local and 24 deployed mobile/desktop cases.
All five backend functions and account constraints support German with unchanged
grants/configuration/consent/recipient scope; native disposable role tests rolled
back completely. No real email was sent. Hosting variables, main, live domain
and the production project remain unchanged. See `qa/i18n/GERMAN.md` and
`supabase/german-language/VERIFICATION.md` for evidence and final user checks.

## Spanish and European Portuguese — 2026-11-02

Application `062cb09` is Ready on the existing amico-fabio-test project,
deployment `dpl_4oPXFN8nuMcszbDb7h7cYmwnQLcH` (27s build), with the confirmed
stable alias https://amico-fabio-iyzo.vercel.app . ES/PT home/package flows passed
eight deployed mobile/desktop browser cases. Both Egypt-guide roots and login
pages returned 200/correct language/noindex; excluded ES/PT blog listings 404.

Local Astro check: 610 files, zero diagnostics. Static test build: 285 pages,
282 canonical/reciprocal checks, 88 editorial link checks, 68 JSON-LD checks.
Existing published routes, IDs, prices, images and Italian-only campaigns are
retained; no new ES/PT blog content. Main/domain, hosting variables and existing
catalog data are unchanged. Account language SQL and five existing backend
functions were extended separately, preserving grants/consent/recipient scope.
See qa/i18n/PROGRESS.md and supabase/site-languages/VERIFICATION.md for the actual
checks, user-confirmed redirect wildcard and remaining real inbox/user checks.

## Clean guide and explore city filters — 2026-11-02

Guide source 1194ae2 is Ready (deployment 2d4i0papv, 18s), including SVG icons,
removed decorative backgrounds, native index and a 360px card-image cap.
Four local guide cases and two deployed smoke cases passed.

Explore source 0d31096 is Ready (deployment ea2sqlf4r, 19s), including the guide
and new IT/EN all/Sharm/Cairo/Luxor-Aswan filters. Two local and two deployed
focused scenarios each covered all four city routes and preserved price order.
Public alias https://amico-fabio-iyzo.vercel.app returned 200/noindex/new controls
in both languages. Astro check: 606 files without diagnostics; build: 171 pages.
No hosting variables, production/main, catalog/provider or campaign changes.
See qa/home-refresh/GUIDE_CLEAN.md and qa/details/EXPLORE_LOCATION.md.

## Deeper portrait, clear CTA and animated contact — 2026-11-02

Application b820fe16083642d051c591b242a09d00d30d7835 is Ready on the existing
amico-fabio-test project, deployment
https://amico-fabio-test-mhwk64c1v-fabio-landing-pages.vercel.app (20s build).
Inspect confirmed https://amico-fabio-iyzo.vercel.app . Both home languages
returned 200/noindex/new portrait/contact markup; nine deployed responsive
portrait/contact cases passed. The seven real-time mobile-motion cases also
passed on this source, resolving the previous approval-review usage-limit
blocker that left source 145777f's deployment verification pending.

Final local Astro check: 604 files, zero diagnostics; static preview build: 171
pages. Deployed mobile Lighthouse: performance 94, accessibility 100, LCP 2.705s,
TBT 80ms, CLS 0 (one lab run). No hosting variables/provider/publication flags,
legacy main, live domain or campaign sources changed. See
qa/home-refresh/PORTRAIT_CONTACT.md, MOBILE_MOTION.md and their deployed JSON.

## Light catalog and package trip previews — 2026-11-02

Application source 55b8c51784657fda717fc6c406ebb9b7d36ae63b is Ready on existing
amico-fabio-test, deployment
https://amico-fabio-test-jbg9oi2r0-fabio-landing-pages.vercel.app (21s build).
Public test alias https://amico-fabio-iyzo.vercel.app is confirmed by inspect.
Explore, tour and package targets in both languages returned 200/noindex.
The preceding catalog source 8831cd9 passed all 24 deployed responsive/content/
interaction cases; the final three-line focus/placeholder correction passed four
focused deployed cases. Every implementation task passed Astro check (597 files,
no diagnostics) and the matching static build (171 pages). Existing texts,
images, editorial badges, prices, ordering and booking configuration match the
browser baseline. No hosting variables/publication/provider settings changed;
legacy main/live site and campaign sources remain unchanged. See
qa/details/CATALOG_PREMIUM.md and catalog-final-deployment.json.

## Premium desktop/iPad home — 2026-11-02

Source b4d83984764802e7085f82457d125208c41cd28a is Ready on existing test project
amico-fabio-test, deployment
https://amico-fabio-test-qgto2cy3p-fabio-landing-pages.vercel.app (22s build).
Stable alias https://amico-fabio-iyzo.vercel.app is unchanged. Both home languages
returned 200/noindex with the new hero; 12 deployed Chromium cases at six widths
passed baseline-content, layout and interaction checks. Astro check: 596 files,
zero diagnostics; local matching noindex/demo build: 171 pages. No hosting
variables or provider/publication settings changed. See
qa/home-refresh/PREMIUM.md and premium-deployment.json. Legacy main, domain and
production project remain unchanged.

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
