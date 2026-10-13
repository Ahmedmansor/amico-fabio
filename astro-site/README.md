# Fabio Egypt — Astro migration workspace

This application is independent of the legacy Vite site at the repository root.
Run its commands from this directory. No production pages have been migrated yet.

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

`npm test` runs all current tests with Node's built-in test runner. No extra
test dependency is needed for this stage; Vitest remains planned for booking.

## Home page

Home is now available at `/it/` and `/en/`, preserving legacy content and styles.
See [qa/home/README.md](./qa/home/README.md) for both-language desktop/mobile
comparisons, existing SEO translation limits, and remaining legacy links.
