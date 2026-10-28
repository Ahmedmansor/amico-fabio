# Fabio Egypt — Astro migration rules

## Scope and workflow
- Work on the existing migration branch. Never switch to or modify `main`.
- Keep the legacy site's source, package manifest, lockfile, and build configuration unchanged during migration.
- Develop the new Astro application in `astro-site/`, with its own package manifest, lockfile, configuration, and build output.
- Read `PROJECT_MAP.md` as the migration reference; it is the document referred to as `PRD.md` in the conversation.
- The user authorized continuing the remaining agreed migration tasks automatically. Implement one focused task at a time, run its checks, review its diff, create its focused commit and report progress, then continue with the next agreed task without asking for permission again. Apply the standing execution authorization below; do not request repeated approval for steps within the agreed task.
- Within the agreed task, select necessary dependencies autonomously, pin versions and document their purpose and verification. Do not add a new paid service or change the approved architecture as a routine dependency decision.
- After each completed task, create a focused commit containing only that task's changes. Do not include unrelated or pre-existing user changes without authorization.
- Approved test deployments are covered by standing execution authorization. Keep legacy main, the live production project and domain unchanged unless the user explicitly extends the task to them.
- Hosting decision confirmed 2026-10-15: the live site is hosted on GitHub Pages as a static website. There is no plan for server hosting or an application server. Keep Astro output static; read Supabase catalog data at build time and publish generated files. Do not introduce SSR, runtime API routes, or a server deployment without a separately approved architecture change. The existing separate static Vercel migration preview remains a test environment.
- Deployment separation requested by the user: legacy `main` stays on GitHub Pages (`fabioegypt.com`); the Astro migration branch targets a separate Vercel project `fabio-astro-test` with root `astro-site/` and PUBLIC_NOINDEX=1 in both Vercel Production and Preview. Never modify the existing Vercel project `amico-fabio`. Follow `astro-site/DEPLOYMENT.md`; local setup does not prove a remote deployment exists.

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
- Old `details.html` and `package-details.html` URL compatibility and redirects are excluded from migration by the user's decision. Do not implement them unless separately requested.
- Maintain language-specific canonical URLs, reciprocal hreflang, a build-generated sitemap.xml, robots.txt referencing it, and a bilingual 404 page. Exclude error pages and redirects from the sitemap; do not claim these guarantee indexing or GEO visibility.

## Migration behavior
- Preserve existing business behavior during migration. The user explicitly confirmed blank child prices resolve to zero, blank `min_pax` resolves to one, and the promo banner continues to use `is_active` without date gating. These are documented legacy defaults, not newly invented values. Keep original source fields alongside mapped values. Do not change prices, booking policies, or banner business rules as part of a technology migration.
- Keep Google Sheets as the initial data provider. Isolate it so a later Supabase migration changes the data layer instead of domain or presentation code.
- Validate required data and IDs; do not silently publish missing required content or invalid prices.
- Fix the known issues in `PROJECT_MAP.md` while migrating the affected feature instead of copying them.
- The user clarified that `welcome.html` must work in Astro as a landing campaign, preserving its original design and lead flow. Its active route is `/welcome/`, Italian-only with existing source content; the unchanged `astro-site/landing-pages/welcome.html` is only an archive. Use the neutral campaign shell, local fonts/Tailwind and feature data/domain/presentation. Preserve the legacy original; do not claim live lead delivery verified without an authorized external test submission.
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

## Approved next phase: single prices and Supabase
- Scope confirmed 2026-10-15: migrate only the existing Google Sheets catalog sources. Defer Auth and all suggested additions, including destination/category tables, price history, CMS/translations/images, campaigns, and inquiry tracking. A relationship table replacing existing package trip-ID lists is catalog normalization, not a new business feature.
- Follow `astro-site/SUPABASE_PLAN.md` and its verification reports for current implementation status and remaining work.
- The user superseded the legacy discount policy: use the nonblank Sheets `d_adult`/`d_child` as the final adult/child amounts; when a `d_*` cell is blank, use its corresponding `p_*` amount. Both child cells blank means zero (free). Both adult cells blank or an invalid selected amount fails validation. Preserve explicit zero values. This clarification was confirmed 2026-10-15 and supersedes the earlier d-only rule.
- Remove crossed-out prices, discount percentages, discount badges and deal messages. Show one starting adult price with Italian/English labels. Keep unrelated editorial badges and recommendation ordering unchanged. Display, sorting, booking and totals must use the same price.
- Supabase stores `adult_price` and `child_price`, with no base/discount columns. Original Sheets snapshots are migration evidence, not public API fields. Legacy source and the source Sheets remain unchanged.
- Prepare and review SQL locally; the user runs schema SQL in Supabase SQL Editor and imports reviewed CSV files. Existing MCP read access does not authorize remote writes. Do not create tables, execute migrations, import data, or change grants/policies remotely without separate explicit authorization.
- Remote execution authorization, 2026-10-15: after reviewing the prepared artifacts, the user explicitly authorized the agent to apply the five catalog tables and their reviewed SELECT-only grants/RLS, import the reviewed existing Sheets catalog into `fabioEgypt` (`iiivnvwspoikfrlclhyr`), verify the result, and implement the build-time Supabase data provider. This supersedes the user-run step for this catalog migration only. Additional business features, Auth, deployment/environment changes on hosting services, and unrelated remote writes remain separately approved.
- Verified 2026-10-15: the catalog schema/import and build-time Supabase provider are implemented. Astro defaults to Supabase; Sheets is available only through explicit provider selection for rollback/audits. Hosting variables and deployed artifacts have not been changed. Use the modern publishable key from ignored `.env.catalog` or build-host environment variables; never embed it into browser configuration or read privileged import env files.
- Follow-up authorization, 2026-10-15: the user authorized tightening EXECUTE grants on the existing `public.rls_auto_enable()` function and continuing the Astro test review. Preserve its owner, body and enabled `ensure_rls` event trigger. Stop before implementing the blog so its scope can be agreed with the user; Auth remains deferred.
- Test deployment authorization, 2026-10-15: the user explicitly approved adding the three public catalog build variables to the separate Vercel project `amico-fabio-test` in Production and Preview, pushing the Astro migration branch and deploying/verifying its test build. This does not authorize changes to legacy `main`, `fabioegypt.com`, or Vercel project `amico-fabio`.
- Prefer a publishable Supabase key (`sb_publishable_...`) for public catalog SELECT, protected by explicit grants and RLS. Legacy `anon` keys are not the default for this new integration. Build-time access needs no browser Supabase client or privileged key.
- Never request, read, print or commit service_role/secret keys, database passwords or access tokens. If a privileged one-off import is needed, the user runs it themselves with an ignored local environment file; do not read that file or log its values.
- Expose only published catalog data through SELECT policies, including child records whose parent is published. No anonymous INSERT/UPDATE/DELETE permissions or private lead/settings fields. Keep campaign leads, Auth, favorites, emails and automatic rebuild hooks outside this phase.
- Keep provider selection in data-layer configuration; reuse feature access functions and identical validation for both providers. Never silently fall back to Sheets when Supabase fails. Static prices update only after a successful rebuild.

## Auth and wishlist continuation — confirmed 2026-10-23
- Later user instructions authorized phased local Auth/wishlist implementation, superseding the earlier catalog-phase deferral for this local work. Follow `astro-site/src/features/auth/PLAN.md` for the agreed flow and `SETUP.md` for operational gates.
- Google login, session/profile display, guest favorites, header count and loading states are implemented locally. Email sign-in remains disabled; account wishlist synchronization must not be claimed until its schema, role isolation and real integration are verified.
- The user authorized continuing local files, logic and tests while away without asking about routine file additions. The later standing execution authorization covers the agreed Auth activation work; do not ask again for its individual steps.
- Prepare account schema and least-privilege RLS for review in `astro-site/supabase/account-wishlist/`. Earlier catalog remote-write authorization does not authorize these new user tables or catalog grant changes.
- Keep static Astro/GitHub Pages architecture and the feature dependency rules. Account wishlist persistence belongs to wishlist/data; Auth exposes identity/session only. Reminder services and consent remain separate phases.
- Preserve unsynchronized guest favorites on failures/signout/account changes. Clear only confirmed items from the same captured guest revision and current account; never wipe browser storage or treat profile metadata as authorization.
- Account-sync source, IT/EN retry/status UI and optional seven-day invitation are implemented and tested synthetically behind `PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED=0`. Do not enable real synchronization until reviewed SQL and actual ownership/RLS tests pass. `role-tests.sql` is an unexecuted disposable-write proposal, not verification evidence.
- On 2026-10-24 the user extended favorites to packages as well as tours, grouped separately in the wishlist with one combined header count. Preserve existing tour browser records. The revised local account proposal adds `package_wishlists` and narrow `packages(id,is_active)` lookup access; remote execution/activation still requires separate authorization.
- Synchronization activation authorized 2026-10-24: the user approved applying the prepared three-table schema and narrow catalog lookup grants, then explicitly approved the disposable Auth/catalog ownership tests with ROLLBACK. Schema is applied on fabioEgypt; real SQL role assertions passed and synthetic catalog cleanup was verified. Local ignored `.env.local` enables account sync for the user's integration test; committed defaults and hosting settings remain off. Authenticated cross-browser Google testing remains a user check, not claimed as agent-verified. Email, SMTP/provider changes and deployment are outside this activation.

## Auth language and decision autonomy — confirmed 2026-10-25

- The latest supported site language used by a signed-in customer is also the language of future emails. Persist actual language changes and use the saved account language at dispatch. This supersedes independent correspondence-language overrides and the earlier instruction to preserve email language when site language changes. Language updates never grant consent or reset reminder timing. Follow auth/PLAN.md section 6.1 for the target and distinguish it from current deployed behavior.
- Continue agreed local Auth/wishlist/reminder work autonomously, choosing routine technical details, local files, tests and copy within approved content without asking for every decision. Record decisions and verification. Earlier routine decision-review gates are superseded; use the latest standing execution authorization for dependency, remote-write, provider-setting, test-email and test-deployment work within its scope.

## Post-login favorites welcome — approved 2026-10-26

- Move optional favorites-reminder consent from the pre-login Google dialog to a one-time welcome dialog after verified first registration. No offers, discounts or newsletter are in scope. Below sign-in controls use the standard linked Terms of Use/Privacy acknowledgement, not explanatory email-subscription copy. Follow auth/PLAN.md sections 4 and 4.2; this supersedes the pre-login checkbox/pending-intent flow as a target, not as a claim of current implementation.
- Keep onboarding eligibility/completion as durable account state separate from consent; exclude existing accounts from automatic new-user prompting. Never claim favorites synchronized before confirmed success. Continue/Not now/close without opt-in must leave account/favorites usable. Preserve current language, ownership, retry, withdrawal and attempt-matched cleanup guarantees. Prepare new onboarding SQL locally; this UX approval alone does not authorize new remote schema writes, external email sending or deployment.

## Auth closure clarification — confirmed 2026-10-26

- Magic Link is essential alongside Google for the current Auth scope, including legitimate non-Google/private-domain addresses. Implement syntax/domain checks and maintained known disposable-domain blocking on the real backend Auth sending path, plus rate limits/resend protections; never claim frontend validation prevents direct endpoint bypass or guarantees mailbox existence/all temporary-domain detection. The latest standing execution authorization covers the provider/hook settings and sign-in email sending needed to finish this agreed flow.
- The real Google registration without reminder consent followed by saving a tour is verified: one saved tour, no preference row, zero consent grants/jobs. Missing preference is a valid no-consent state.
- Administrative account/data deletion requests via the existing public contact info@fabioegypt.com are approved as the current UX/operational approach. Document IT/EN request instructions, identity verification, safe deletion/mail-stop and retention handling; a self-service Delete Account button is deferred. This approval does not authorize arbitrary deletion of users; each actual deletion needs the user's request or applicable operational authorization.
- Full real reminder delivery remains unverified. Confidence in tested logic does not authorize widening recipient/account scope or count as inbox/withdrawal evidence. Follow the current closure checkpoint in auth/PLAN.md and preserve ongoing unrelated working-tree changes.


## Standing execution authorization — confirmed 2026-10-26 (latest instruction)

- The user explicitly cancelled repeated permission requests and authorized completing the agreed Auth/Magic Link flow end to end, leaving only final user testing. This section supersedes earlier separate-approval gates for the actions listed here, including historical local-only and activation handoffs in other project documents. Do not ask the user to approve those steps again.
- Proceed autonomously with required code/UI, dependencies/tooling, tests, reviewed Auth-protection SQL/RLS/RPC changes and disposable rollback/concurrency tests on fabioEgypt (`iiivnvwspoikfrlclhyr`), Edge Function deployment, required Supabase Auth/hooks/redirect/provider settings, the existing Brevo integration, local/test environment configuration, pushing the migration branch and deployment to the existing approved Vercel test project verified through `astro-site/DEPLOYMENT.md`.
- Enable functional email sign-in for legitimate non-Google/private-domain addresses with server-side validation, known disposable-domain blocking, signing, rate limits, conservative quota allocation and replay protection. Real sign-in emails resulting from the user's test requests are authorized; do not send unsolicited messages or choose unrelated recipients for smoke tests. Request the intended recipient only if an agent-initiated real-email test is necessary and none is authorized.
- Preserve Google login, favorites, consent/withdrawal, the existing restricted reminder recipient scope and the static Astro architecture. Do not modify legacy main, `fabioegypt.com`, the production Vercel project, billing or unrelated data; arbitrary user/account deletion and broad reminder sending are not implied by this task.
- Review remote changes and rollback paths before applying them. Reuse existing secure credential mechanisms; never print or commit secrets. Continue all independent work if a particular integration is unavailable. Ask for user action only for a concrete access/secret/interactive-login blocker, an actual tool approval rejection or a material action outside the agreed scope; explain the exact blocker once instead of reopening approval for the whole task.
- Record real outputs and focused commits. Do not describe disabled preview UI or mocked sending as a working live flow. Report the exact ready test URL and a short final user checklist once the actual activation has been verified.

## Login master-plan revision — confirmed 2026-10-28

- The user's supplied master plan supersedes the earlier no-password/login-popup target: use standalone `/it/login/` and `/en/login/`, with Italian `/login/` entry; email/password signup and signin, Google, existing-account Magic Link recovery, and Turnstile on protected email requests. Keep the static architecture and lossless guest merge.
- The user also adds a separate optional offers/discounts consent target. Keep it independent of existing one-time favorites-reminder consent; do not broaden reminder recipients or introduce promotional sending. Signup metadata is only an intention, not authorization or durable proof of a verified grant. Preserve withdrawal against late activation/stale writes.
- Follow `astro-site/src/features/auth/LOGIN_REVISION.md` and the current top checkpoint in PLAN.md/SETUP.md. Local implementation/tests are committed; new public flags stay off. Marketing schema and disposable role tests in `astro-site/supabase/marketing-consent/` are local proposals, not executed verification. Complete native tests before activation; never claim prepared SQL is applied.
- The user is configuring Turnstile credentials. Continue independent authorized work; coordinated page/provider activation waits for actual setup. Public Site Key may be supplied; secrets belong only in provider dashboards/secure mechanisms. No secret values belong in chat/source/logs. Actual Vercel test hostname is `amico-fabio-iyzo.vercel.app` (project `amico-fabio-test`), per DEPLOYMENT.md.
- Existing signed Auth email hook v6 is ACTIVE; downloaded sources match the reviewed files and unsigned POST returned 401. This does not prove new signed dispatch or inbox receipt. No new real email or marketing dispatch was sent. Legacy main, production domain/project and existing reminder scope remain unchanged.
- Later on 2026-10-28 the user deferred Microsoft/Azure; remove it from the current plan and provider UI. They saved TURNSTILE_SITE_KEY in ignored astro-site/.env.local and reported enabling Supabase Attack Protection with the secret. Accept that local public-key alias and continue Google/email/password. The user requested avoiding repeated broad checks; use focused verification only when necessary and do not claim older results verify subsequent edits.
- Latest same-day email UX clarification: use OTP code entry as primary confirmation/recovery, keeping the existing link as an alternative in the same email. This supersedes older no-OTP-entry instructions. The first successful code/link use consumes the confirmation; one cannot activate two browser sessions with it. Preserve native expiry/verification limits, CAPTCHA-protected resends, quotas, signing, no-code/token logging/storage and the existing browser-bound wishlist guarantees.
