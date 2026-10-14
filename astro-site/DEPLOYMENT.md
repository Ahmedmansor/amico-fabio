# Production and test flavors

The repository uses the same Astro source with build-time configuration.
Existing production remains legacy Vite on GitHub Pages, branch `main`, domain
`fabioegypt.com`. The Astro migration branch is `try-to-refactoring-to-astro`.
Do not alter the existing Vercel project `amico-fabio`.

## New Vercel test project (account setup still required)

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

No Vercel project creation, environment update, Git push or deployment has been
performed as part of local preparation. The browser session requires login.
This file is the concrete setup specification, not evidence that Vercel is set up.

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
- Canonical, hreflang and absolute share-image origins remain `fabioegypt.com`.
  Test pages use relative UI assets and work locally/on Vercel, but this does
  not validate public social cards before the production assets are published.
- This is indexing control, not authentication or a guarantee that every crawler
  obeys. It does not make the test site private.

Variables are embedded in static HTML at build time. Updating a variable requires
a rebuild/redeploy; changing a Vercel variable cannot alter an existing artifact.
Never commit an environment file with PUBLIC_NOINDEX=1 as a shared default.
No new dependency was added; existing Astro/Vite facilities load the setting.

## Local verification

From `astro-site/` in PowerShell:

```powershell
$env:PUBLIC_NOINDEX='1'
npm run build
node scripts/verify-flavor.mjs --test
Remove-Item Env:PUBLIC_NOINDEX
npm run build
node scripts/verify-flavor.mjs
npx astro check
npm test
```

The local review ran both builds and restored the normal indexable build last.
Do not copy a previously generated test `dist/` into GitHub Pages. Build fresh
from the intended production source without the test variable when production
migration is separately authorized. Current legacy production remains untouched.
