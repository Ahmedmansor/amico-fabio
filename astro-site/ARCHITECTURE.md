# Feature architecture

This workspace uses feature-first organization. The directories are reserved
for migration tasks; empty directories do not represent migrated functionality
or implemented tests.

## Layout

```text
src/
  pages/                         route assembly only
  features/
    <feature>/
      data/                      provider access and mapping
      domain/                    pure functions and domain types
        __tests__/               tests of domain behavior
      presentation/              Astro components and browser interactions
  shared/
    components/                  header, footer, and shared UI
    layouts/                     page shells
    seo/                         canonical, hreflang, and sitemap helpers
    i18n/                        dictionaries and translation access
    config/                      language and public contact configuration
    styles/                      local shared styles
```

The feature directories are `home`, `explore`, `tours`, `packages`, `booking`,
`sharm-secrets`, `sharm-offer`, `legal`, and `welcome`. `setup` contains the
temporary installation check page and is not the production home page.

## Dependency direction

```text
pages -> feature presentation and feature data
presentation -> domain and data
data -> domain
domain -> no infrastructure dependencies
```

- Domain code may use its own domain types and pure domain functions. Do not
  import Astro, providers, data or presentation modules, UI frameworks, or
  environment-dependent shared modules into domain code.
- Domain code does not access network, DOM, storage, environment variables, or
  external services. Pass needed values in arguments and return results.
- Domain tests exercise rules and edge cases without network or browser setup.
  Put tests alongside the relevant feature under `domain/__tests__/`.
- Data code owns external I/O, CSV parsing, provider response mapping, and
  calls to pure domain validation. Return domain models rather than raw
  Google Sheets rows.
- Expose data access through functions such as `getTrips()` and `getPackages()`.
  Later provider replacement belongs behind those functions.
- Presentation code renders those models and binds only required interaction.
  Keep calculation and message-generation rules in domain code.
- Page files select a route, obtain its data through feature data functions,
  and compose presentation components. They do not implement CSV parsing,
  booking calculations, or large templates.
- Shared UI can depend on shared configuration and i18n. Shared code must not
  become a back door from domain to network or browser APIs.
- Cross-feature dependencies must remain acyclic. A package's included trips
  are obtained through the tours data API, not by reading its provider directly.

## Import aliases

`@features/*` resolves to `src/features/*` and `@shared/*` resolves to
`src/shared/*`. Aliases simplify paths; they do not grant permission to cross
layer boundaries. Keep imports within a layer relative where appropriate.

## Migration and validation

Preserve the legacy look and actual content. Do not add dummy business records,
invent translations, or introduce placeholder prices to populate these folders.
Populate a feature only when its migration task is authorized.

The feature's data orchestration must run required validation during static
generation and propagate errors so the build fails. Pure validation rules belong
in domain and get domain tests. Messages must identify the offending record or
field. Validate required fields, unique IDs and slugs within a route namespace,
price/translation/image associations, and included-trip references. Equivalent
Italian and English pages intentionally share a slug.

Vitest will be added after package approval for the booking/domain test task.
The reserved test directories are not executable tests. No business logic is
introduced by the directory setup, so there are no domain tests to run yet.

For every implementation task, run `npx astro check` and `npm run build` from
this workspace. For migrated pages, also compare legacy and Astro screenshots
in both languages at matching mobile and desktop widths. Follow `../AGENTS.md`
for the full workflow and commit rules.
