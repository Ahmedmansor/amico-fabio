# Fabio Egypt — Astro migration rules

## Scope and workflow
- Work on the existing migration branch. Never switch to or modify `main`.
- Keep the legacy site's source, package manifest, lockfile, and build configuration unchanged during migration.
- Develop the new Astro application in `astro-site/`, with its own package manifest, lockfile, configuration, and build output.
- Read `PROJECT_MAP.md` as the migration reference; it is the document referred to as `PRD.md` in the conversation.
- The user authorized continuing the remaining agreed migration tasks automatically. Implement one focused task at a time, run its checks, review its diff, create its focused commit and report progress, then continue with the next agreed task without asking for permission again. New dependency approvals, deployment/domain changes and business changes retain their separate approval requirements.
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
- For the main site, every new user-facing string must exist in both Italian and English dictionaries under the same key, including form messages, placeholders, and accessibility labels. Landing campaigns follow the campaign-language rules below.
- Generate a separate static page per language for every published tour and package.
- Use the same slug in both languages initially. Keep stable IDs separate from slugs.
- Use `/it/tours/<slug>/`, `/en/tours/<slug>/`, `/it/packages/<slug>/`, and `/en/packages/<slug>/`.
- Language switching must link to the corresponding content in the other language.
- Keep `details.html` and `package-details.html` as small compatibility pages when that task is authorized. Their scripts read `id`, look it up in a build-generated map, choose a supported stored language or default `it`, and redirect with `location.replace()`.
- Provide a no-JavaScript link to the tours list and a useful fallback for unknown IDs.
- Generate language-specific canonical URLs, reciprocal hreflang links, and a sitemap when the SEO task is authorized.

## Migration behavior
- Preserve existing business behavior during migration. The user explicitly confirmed blank child prices resolve to zero, blank `min_pax` resolves to one, and the promo banner continues to use `is_active` without date gating. These are documented legacy defaults, not newly invented values. Keep original source fields alongside mapped values. Do not change prices, booking policies, or banner business rules as part of a technology migration.
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
- For each migrated main-site page, compare against the legacy page in Italian and English on mobile and desktop widths. For a landing campaign, compare every language actually published by that campaign. Report every missing section, text, image, price, or link. Minor spacing or color differences are acceptable; missing or wrong content is not.
- Capture screenshots of the legacy and migrated pages at matching mobile and desktop widths to support the comparison.
- Keep QA screenshots local and ignored by Git; commit comparison JSON, reports and verification scripts. Clean previously committed screenshot history only in the separately authorized cleanup task after migration.
- Never invent prices, copy, translations, images, or IDs. If something is missing, report it and stop the affected task instead of filling the gap.
- Data validation must fail the build with a clear message on: missing required fields, duplicate IDs or slugs, unmatched price/translation/image links, or packages referencing unknown trips. Identify the affected record and field in the message. Validate slug uniqueness within each route namespace; the same slug across language equivalents is intentional.
- Carry `public/CNAME` (`fabioegypt.com`) into `astro-site/public/` before any deployment task.
- Pin Node via `.nvmrc` and the `engines` field in `astro-site/package.json`. Do not install Node inside the project folder.
- The `domain/` layer and its tests are required by design; do not remove or flatten them to reduce code.
- Never report a check as passing without showing its real output. If a command cannot be run, say so plainly instead of assuming success.

## Landing campaigns
- Read `صفحات الهبوط.md` for the detailed approved campaign approach and migration sequence; keep it consistent with these rules.
- Use the same Astro application and build for the main site and landing campaigns. Vanilla JS owns only the interactions that need browser code.
- Different campaign headers, footers, layouts, section order and color palettes are intentional. Preserve the legacy campaign design during migration; do not replace it with the main-site shell or redesign it.
- Give each campaign its own feature with `data/`, pure `domain/` with tests, and `presentation/`. Keep routes in `src/pages/` limited to assembly.
- Share neutral document metadata, language direction, analytics, public contact configuration and genuinely reusable business logic. Campaign-specific header/footer/sections belong to its presentation layer; reusable visual templates may live in shared presentation components.
- Isolate campaign CSS and theme variables from the main site and other campaigns. The neutral document shell must not automatically import main-site global styles or main-site header/footer. Reuse an existing visual template when appropriate; do not force materially different designs into one component with many conditional flags.
- The shared language configuration remains the only definition of supported language codes and directions. Each campaign selects a subset with actual approved content. Validate matching keys only across that campaign's published language dictionaries; do not fabricate or require unapproved language versions.
- `offerta-sharm` is an Italian-only campaign aimed at Italian travelers. Preserve `/offerta-sharm/`, its Italian text, its distinct header/footer/palette, its form behavior and existing marketing claims. Do not create an English version unless separately authorized.
- Treat language equivalents of the same campaign as translations. Link only existing equivalent routes in a language switcher and hreflang; separate offers or audience-specific messages are separate campaigns, not automatic translations.
- Keep stable campaign IDs separate from routes, language and design templates. Validate published route uniqueness and required campaign text/image associations. Preserve existing ad URLs unless their change is explicitly authorized.
- Reuse pure form validation and WhatsApp message functions only where business behavior is actually shared. Pass campaign-specific messages/settings as arguments; keep DOM, analytics and external access outside domain.
- Record `generate_lead` through shared analytics without personal form values. Never add names or phone numbers to analytics events.
- Before a future redesign, keep a separate backup of the approved visual baseline; ignored local screenshots are not included in a fresh Git clone.

## Required verification and commits
- Run `npx astro check` and `npm run build` from `astro-site/` after every implementation task.
- Add Vitest tests for total-price calculation and WhatsApp message generation when implementing booking. Run relevant tests for changes to those functions.
- Do not mark a task complete or commit it if a required check fails. Fix the failure or clearly report the blocker.
- Dependency installation and checks require the approved dependencies and supported Node runtime; draft files before installation are not a completed task.
- Before committing, inspect the diff and stage explicit task files only. Preserve unrelated user changes.
- Report what changed, what checks ran and their real results, how to verify it, and the commit hash when committed. Continue with the next agreed migration task under the user's standing authorization; pause dependent work only for an actual blocker or a separately required approval.
