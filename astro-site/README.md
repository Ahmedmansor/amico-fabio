# Fabio Egypt — Astro migration workspace

This application is independent of the legacy Vite site at the repository root.
Run its commands from this directory. Migrated routes are listed below.

## Runtime and dependencies

Node is pinned to **24.21.0** in `package.json`, `.node-version`, and `.nvmrc`.
Node must be installed outside the repository using an external runtime manager
or the official Windows installer. Never place a Node distribution inside this
project. Verify that the active runtime matches the pinned version before
installing dependencies or running Astro commands. The user installed Node
system-wide, and `node -v` was verified as `v24.21.0`.

The user approved the dependencies pinned in `package.json`. They are installed,
and `package-lock.json` records the resolved dependency tree. Use `npm ci` for
subsequent installations.

After installing and activating Node outside the repository, verify it in PowerShell:

```powershell
node --version
npm --version
```

After dependency approval and installation, the project commands are:

```sh
npm run dev
npx astro check
npm run build
npm run preview
```

The setup page is an installation smoke check, not a migrated homepage. Its
strings have matching Italian and English keys. No client-side script is needed.

Tailwind v4 uses its official Vite plugin and `@import "tailwindcss"` in local
CSS. TypeScript uses Astro's strict configuration. Feature presentation code
lives under `src/features/`; shared code lives under `src/shared/`; page files
assemble routes only. Each migrated feature is split into data, domain, and
presentation layers. Domain functions and their tests remain part of the design.
Preserve the legacy appearance and content, and compare migrated pages against
the legacy pages in both languages at mobile and desktop widths. Follow the
complete migration discipline in the repository's `AGENTS.md`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for feature ownership, dependency
direction, import aliases, and domain test locations. Empty layer directories
reserve the structure for later tasks; they do not contain migrated content yet.

## Shared configuration and translations

`src/shared/config/languages.ts` is the single supported-language and direction
configuration. Italian is the default. `resolveLocale()` accepts preference
values supplied by the caller and selects the first enabled language, without
accessing browser storage itself.

`src/shared/config/site.ts` contains the public domain, WhatsApp number, and
social URLs copied from the legacy site. Consumers must use this configuration
as they are migrated. It does not contain secrets or initialize analytics.

The setup dictionary is checked against the configured languages and matching
keys during static generation; TypeScript also checks its language coverage and
message shape. Missing dictionaries, missing/extra keys, mismatched value types,
and mismatched array lengths throw descriptive errors. The full legacy content
has not been imported yet. Arabic will need its actual dictionary and direction
entry before its pages can be generated.

Run the focused shared-configuration checks with the built-in Node test runner:

```sh
node --test src/shared/i18n/__tests__/configuration.test.mjs
```

These checks use Node 24's TypeScript support and install no additional package.
They do not replace the planned Vitest tests for feature domain behavior.

## Migrated legal page

Preview `/it/legal/` and `/en/legal/` using `npm run dev` or, after building,
`npm run preview`. Legal content, the header/footer, local fonts, and icons are
rendered at build time. Interactive browser code is limited to navigation,
language preference persistence, the index, and scroll indicators.

See [qa/legal/README.md](./qa/legal/README.md) for comparisons with the legacy
page and commands to reproduce the content and asset checks. Domain tests for
the legal page use the built-in Node test runner; booking's Vitest tests remain
a later task.

## Catalog data

Feature data functions now read the existing public Google Sheets sources.
Each build validates the live catalog before generating pages. See
[qa/data/README.md](./qa/data/README.md) for the provider boundary, preserved
legacy business defaults, source inspection, and test commands.

`npm test` runs the Node test suite and the approved Vitest domain tests.

## Home page

Home is now available at `/it/` and `/en/`, preserving legacy content and styles.
See [qa/home/README.md](./qa/home/README.md) for both-language desktop/mobile
comparisons, existing SEO translation limits, and remaining legacy links.

## Explore page

Explore is now available at `/it/explore/` and `/en/explore/`, with static Sharm,
Cairo and Luxor/Aswan routes. Home destination links use the migrated routes.
See [qa/explore/README.md](./qa/explore/README.md) for original prices/content,
location-query compatibility, filter/sort/pagination checks and comparisons.

## Sharm Secrets guide

The six-section guide is available at `/it/sharm-secrets/` and
`/en/sharm-secrets/`, preserving legacy content, style, index and photo gallery.
See [qa/sharm-secrets/README.md](./qa/sharm-secrets/README.md) for matching
screenshots, source limitations and reproducible verification.

## QA screenshot storage

Capture legacy and Astro screenshots for visual comparisons, but keep raster
images under `qa/` local and ignored by Git. Commit the comparison JSON, README
reports and verification scripts. A fresh clone will not include screenshots;
regenerate them or keep a separate backup of the baseline before a redesign.
Previously committed screenshot history will be cleaned up after migration.

## Italian landing campaign

`/offerta-sharm/` retains its original Italian campaign content and separate
design. The neutral `DocumentShell.astro` shares metadata/analytics with the
main site without forcing its header/footer or stylesheet on campaigns.
See [qa/sharm-offer/README.md](./qa/sharm-offer/README.md) and the root
`صفحات الهبوط.md` for comparison evidence and the approved campaign approach.
`npm test` now runs the existing Node tests plus the approved Vitest domain
tests. `npm run test:domain` runs Vitest by itself.

## Independent tour pages

All 22 published tours now have separate static Italian and English pages at
`/{locale}/tours/{slug}/`. Explore trip cards link to the corresponding language.
The original content, gallery, prices and booking behavior are preserved.
See [qa/tours/README.md](./qa/tours/README.md) for the 88 desktop/mobile
comparisons and booking checks. Legacy URL redirects remain a separate pending
task. Nothing has been deployed.

## Independent package pages

All 14 published packages now generate 28 static bilingual pages under
`/{locale}/packages/{slug}/`. Explore cards use those URLs. Original included
trip cards/modals and package booking behavior are retained. See
[qa/packages/README.md](./qa/packages/README.md) for comparisons and verification.

## Technical SEO and recovery

Production builds generate `sitemap.xml` and `robots.txt`, after checking each
published canonical and reciprocal hreflang link. The root opens the default
Italian home; unknown routes show a bilingual 404 with recovery links.
See [qa/seo/README.md](./qa/seo/README.md) for commands and hosting limitations.
Legacy URL redirects are excluded from scope by the user's decision.

## Welcome landing page

The Italian catalog lead page is active at `/welcome/`, preserving its original
campaign design and Google Apps Script/WhatsApp flow. See
[qa/welcome/README.md](./qa/welcome/README.md) for comparisons and the external
submission test still required. `landing-pages/welcome.html` remains an archive.

## Tour and package sharing

All 72 tour/package language pages use their original poster for Open Graph and
Twitter previews, with localized text and absolute generated JPEG URLs. See
[qa/sharing/README.md](./qa/sharing/README.md) and its per-page metadata report.
