# Translated catalog sections — 2026-11-03

Follow-up to localized catalog slugs on the same feature branch. Implemented
locally; no production deployment, Supabase write or email/booking submission.

| Locale | Tours | Packages |
| --- | --- | --- |
| it | escursioni | pacchetti |
| en | tours | packages |
| es | excursiones | paquetes |
| pt | excursoes | pacotes |
| de | ausfluege | reisepakete |

Section names live in the pure shared catalog-routes module, typed against the
single supported-language configuration. Stable catalog IDs/provider slugs and
existing saved favorites remain unchanged. All canonical page links, alternate
language links, metadata, included-tour JSON-LD, wishlist/cards and editorial
references use the central path builder. Header active state and the restricted
Auth return-path allowlist now recognize the locale-specific namespaces.

The static `[locale]/[section]/[slug]` route only obtains feature data and
assembles feature presentation components. The previous route presentation is
retained inside each catalog feature; no redesign/content/price change.

Both previous forms remain as direct redirects to the final canonical URL:

```text
/it/tours/super_safari_5_senses/
/it/tours/super-safari-i-5-sensi-del-sinai/
  -> /it/escursioni/super-safari-i-5-sensi-del-sinai/
```

English canonical paths are not redirected to themselves. Alias deduplication
produces 324 compatibility documents (180 original URLs plus 144 intermediate
non-English URLs). These remain static immediate meta/JavaScript redirects,
not HTTP 301, with noindex and final canonical/OG metadata. The sitemap retains
230 indexable URLs and excludes all aliases. Existing remote email workers
continue using the compatible legacy manifest URLs; updated local consumers
use validated canonical_url with the translated section. No remote deployment
or widening of mail/consent scope is needed to preserve existing worker access.

## Real checks

```text
npx astro check
Result (724 files): 0 errors, 0 warnings, 0 hints

npm run build
Verified canonical and reciprocal hreflang for 230 indexable pages
572 page(s) built in 18.27s; Complete!

Focused Node tests (Auth safe returns, catalog schema, localized SEO):
19 tests, 19 pass, 0 fail
Focused Vitest tests (routes, blog references, email compatibility):
4 files, 24 tests passed

node qa/seo/verify-localized-routes.mjs
180 pages, 324 preserved aliases, 1900 canonical internal links;
5-language switchers/hreflang, prices, schema and backward-compatible email manifest passed.

node scripts/verify-catalog-seo.mjs
180 static pages verified: text, canonical/hreflang, H1, schema,
visible EUR prices, itineraries, included tours and images match.
```

Browser smoke on the local static preview confirmed intermediate Italian tour
URL -> `/it/escursioni/.../`, preserving query and fragment; its menu linked all
five translated sections, and clicking German opened `/de/ausfluege/.../` with
the corresponding title and unchanged EUR 55 price. Original package ID URL
`/it/packages/dolce_vita_family/` opened `/it/pacchetti/dolce-vita-family-relax/`
with EUR 160, included-trip links under `/it/escursioni/`, and a localized login
return URL. These are navigation/rendering checks, not real sign-in or booking.

Production has not been published. Rollback is a source revert and fresh build;
do not edit catalog IDs or delete user favorites. Build output remains ignored.
