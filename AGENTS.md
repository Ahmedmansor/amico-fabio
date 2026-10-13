# Fabio Egypt — Astro migration rules

## Scope and workflow
- Work on the existing migration branch. Never switch to or modify `main`.
- Keep the legacy site's source, package manifest, lockfile, and build configuration unchanged during migration.
- Develop the new Astro application in `astro-site/`, with its own package manifest, lockfile, configuration, and build output.
- Read `PROJECT_MAP.md` as the migration reference; it is the document referred to as `PRD.md` in the conversation.
- Implement only the single task explicitly authorized by the user. Report its changes and verification, then stop before the next task.
- Before installing any new direct dependency or changing a dependency version, show the user the package list and its purpose. Wait for approval of the list.
- Before the first migration commit, show the full contents of this file and wait for the user's review approval.
- After each completed task, create a focused commit containing only that task's changes. Do not include unrelated or pre-existing user changes without authorization.
- Do not publish, deploy, or change the domain without explicit authorization.

## Stack and browser code
- Use Astro, Tailwind CSS, and Vanilla JavaScript for the site. TypeScript is allowed for types, configuration, and pure logic.
- Do not add React, Vue, or another UI framework.
- Render content as static HTML at build time wherever possible.
- Add small, feature-scoped browser scripts only where interaction requires them. Do not recreate a global client-side application controller.
- Use a supported Node LTS release installed outside the repository. Pin its exact version in `astro-site/.nvmrc` and `astro-site/package.json` (`engines.node`), and document activation. Never install Node inside the project folder.

## Architecture
- Organize by feature under `astro-site/src/features/<feature>/`.
- Split each feature into `data/`, `domain/`, and `presentation/`. The domain layer and its tests are required by design; do not remove or flatten them to reduce code.
- Allowed dependency direction: `presentation -> domain/data`; `data -> domain`.
- `domain/` contains pure functions and domain types only. It must not depend on Astro, data or presentation modules, network access, DOM APIs, browser storage, environment variables, or external services.
- `data/` owns external access and maps provider-specific responses to domain models. Access goes through feature functions such as `getTrips()` and `getPackages()`.
- `presentation/` owns Astro components and feature-scoped browser interactions.
- `src/pages/` only assembles routes, obtains data through the data layer, and composes presentation components.
- Shared header, footer, layouts, SEO, i18n, styles, and public configuration belong under `src/shared/`.
- Keep feature imports acyclic. Do not bypass another feature's data access functions to read its provider directly.

## Languages and URLs
- Begin with Italian (`it`) and English (`en`), with Italian as the default.
- Define supported languages and their direction in a single shared configuration, ready for later Arabic support.
- Every new user-facing string must exist in both dictionaries under the same key, including form messages, placeholders, and accessibility labels.
- Generate a separate static page per language for every published tour and package.
- Use the same slug in both languages initially. Keep stable IDs separate from slugs.
- Use `/it/tours/<slug>/`, `/en/tours/<slug>/`, `/it/packages/<slug>/`, and `/en/packages/<slug>/`.
- Language switching must link to the corresponding content in the other language.
- Keep `details.html` and `package-details.html` as small compatibility pages when that task is authorized. Their scripts read `id`, look it up in a build-generated map, choose a supported stored language or default `it`, and redirect with `location.replace()`.
- Provide a no-JavaScript link to the tours list and a useful fallback for unknown IDs.
- Generate language-specific canonical URLs, reciprocal hreflang links, and a sitemap when the SEO task is authorized.

## Migration behavior
- Keep Google Sheets as the initial data provider. Isolate it so a later Supabase migration changes the data layer instead of domain or presentation code.
- Validate required data and IDs; do not silently publish missing required content or invalid prices.
- Fix the known issues in `PROJECT_MAP.md` while migrating the affected feature instead of copying them.
- Migrate `welcome.html` as a catalog lead form, preserving its intended Google Apps Script and WhatsApp flow while checking submission success and handling failure.
- Replace Tailwind CDN and external Google font loading with the local setup.
- Use Astro image optimization for suitable local images, with responsive sizes and explicit dimensions.
- Centralize the WhatsApp number and social links in one shared public configuration file.
- Migrate GA4 through shared code, including `generate_lead`. Do not send personal form values such as names or phone numbers to analytics.
- Never put secrets in source code, public configuration, generated HTML, logs, or commits.

## Migration discipline
- Preserve the current look and content during migration. Do not redesign, restyle, or "improve" the UI; any redesign is a separate, explicitly authorized task.
- For each migrated page, compare against the legacy page in Italian and English on mobile and desktop widths. Report every missing section, text, image, price, or link. Minor spacing or color differences are acceptable; missing or wrong content is not.
- Capture screenshots of the legacy and migrated pages at matching mobile and desktop widths to support the comparison.
- Never invent prices, copy, translations, images, or IDs. If something is missing, report it and stop the affected task instead of filling the gap.
- Data validation must fail the build with a clear message on: missing required fields, duplicate IDs or slugs, unmatched price/translation/image links, or packages referencing unknown trips. Identify the affected record and field in the message. Validate slug uniqueness within each route namespace; the same slug across language equivalents is intentional.
- Carry `public/CNAME` (`fabioegypt.com`) into `astro-site/public/` before any deployment task.
- Pin Node via `.nvmrc` and the `engines` field in `astro-site/package.json`. Do not install Node inside the project folder.
- The `domain/` layer and its tests are required by design; do not remove or flatten them to reduce code.
- Never report a check as passing without showing its real output. If a command cannot be run, say so plainly instead of assuming success.

## Required verification and commits
- Run `npx astro check` and `npm run build` from `astro-site/` after every implementation task.
- Add Vitest tests for total-price calculation and WhatsApp message generation when implementing booking. Run relevant tests for changes to those functions.
- Do not mark a task complete or commit it if a required check fails. Fix the failure or clearly report the blocker.
- Dependency installation and checks require the approved dependencies and supported Node runtime; draft files before installation are not a completed task.
- Before committing, inspect the diff and stage explicit task files only. Preserve unrelated user changes.
- Report what changed, what checks ran and their results, how to verify it, and the commit hash when committed. Then stop.
