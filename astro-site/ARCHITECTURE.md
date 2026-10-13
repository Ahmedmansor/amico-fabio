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
in the main site's two languages, or the campaign's actual published languages,
at matching mobile and desktop widths. Follow `../AGENTS.md`
for the full workflow and commit rules.

## Landing campaigns: approved architecture

One Astro application serves both the main site and independent campaigns.
Campaign visual differences are intentional. The neutral shared document shell
owns HTML/head metadata, language/direction and analytics, without importing
the main site's header/footer or its global theme styles. Main-site and campaign
layouts compose that shell with their own presentation components. This is an
approved target design; the existing `BaseLayout.astro` currently remains the
main-site layout until the landing migration implements the neutral boundary.

Each campaign remains a feature: `data/` owns content access and mapping,
`domain/` owns pure validation/types and tests, and `presentation/` owns its
layout, header, footer, sections, assets, theme and browser scripts. The reserved
`sharm-offer` feature owns the current `offerta-sharm` campaign. Future campaigns
receive their own feature and stable ID rather than being encoded as language
variants of an unrelated offer. `pages/` only selects data and composes routes.

Campaign settings select approved languages from the central language list,
actual routes and, where useful, a reusable visual template. Only those language
pages are generated. Equivalent translations share message keys within the
campaign; campaigns targeting different audiences with different offers are
independent. A language switcher and reciprocal hreflang must only reference
published equivalents. A single-language campaign does not inherit the main
site's bilingual publication requirement.

Scope styles to campaign components or an explicit campaign root. Define its
palette through CSS variables on that root; do not override the main site's
global colors. Reuse a template for campaigns with the same structure. Different
structures may use different Astro layouts/components. Shared visual code stays
under `shared/`; one-off campaign visual code stays in the campaign feature.
Do not build a universal layout with many flags or copy business logic into each
design. Required interactive behavior uses small Vanilla JS modules.

Public contact settings and analytics stay centralized. Pure form validation
and WhatsApp message functions can be reused when their rules match; supply
campaign-specific copy/configuration as inputs. Preserve each existing form's
fields, limits and message wording. Browser modules perform navigation and
analytics, with no personal values in `generate_lead`. No network/DOM/analytics
dependency is allowed in domain functions.

### Current offerta-sharm migration

Keep `/offerta-sharm/` and Italian-only publication. Retain its distinct header,
footer, palette, eight destination cards, four booking steps, six Vimeo
testimonials, four FAQs, lead form and five trust badges. Preserve the original
Italian assistance claims, WhatsApp flow and GA4 event. Do not introduce an
English dictionary, switcher, new offer, payment flow or redesigned navigation.
Compare against legacy at desktop/mobile widths in Italian. Screenshots stay
local; comparison JSON and reports stay tracked.

### Migration sequence from the current state

1. Record this campaign architecture and publication exception (this task).
2. Migrate `offerta-sharm` with its original Italian campaign presentation;
   introduce Vitest only after dependency approval for WhatsApp domain tests.
3. Prioritize independent bilingual tour pages, then package pages and booking
   logic, followed by `welcome.html`, compatibility and SEO tasks. The detailed
   sequence and campaign policy are recorded in `../صفحات الهبوط.md`.
4. After the Astro migration is finished, perform the separately approved Git
   screenshot-history cleanup. Deployment and redesign remain separate tasks.
