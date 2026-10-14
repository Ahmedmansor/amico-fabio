# Technical SEO migration

The build now audits all generated indexable HTML, validates self-canonical URLs,
required titles/descriptions, existing alternate targets and reciprocal hreflang,
then generates `dist/sitemap.xml` and `dist/robots.txt` using the shared domain.
The sitemap includes 87 published pages: 86 main-site language pages and the
Italian-only `/offerta-sharm/` campaign. It excludes the root redirect and 404.
No unpublished English campaign equivalent is fabricated. No artificial
last-modified dates, priorities or change frequencies are added.

This uses Astro's existing build hook; no dependency was installed. Files are
generated after a successful production build, not by the dev server. Inspect
them through the existing production preview at port 4322. A failed canonical
or language-link check fails the build instead of emitting a misleading sitemap.

`/` previously served the migration setup placeholder. It now leads to `/it/`
using Astro's static redirect output (HTML meta refresh); it is not a server-side
301 on static hosting. This default-language entry is separate from old URL
compatibility, which the user explicitly excluded. No old details redirects
were created, and legacy source/configuration are unchanged.

`404.html` provides Italian and English home/explore recovery links without JS.
It uses `noindex, follow`, has no canonical/hreflang pretending it is a content
page, and is excluded from the sitemap. A nonexistent path returns HTTP 404 on
both the existing development server and Astro production preview. Actual
hosting status/fallback behavior must be checked during a separately authorized
deployment; local success does not verify production hosting.

Screenshots `404-desktop.png` (1440×900) and `404-mobile.png` (390×844) stay local
and Git-ignored. Both language sections and all four recovery links were visible
in the browser; the mobile page has no horizontal overflow. This new error page
has no legacy page to compare against. Existing main/campaign UI was not restyled.

## Verification

```sh
npm test
npx astro check
npm run build
node scripts/verify-seo.mjs
```

The verifier checks the complete generated sitemap, robots policy and bilingual
404 recovery links, then uses the running servers on ports 4321/4322 to verify
the real unknown-path HTTP status and root entry. Unit tests exercise rejection
of missing canonical and absent language equivalents, sitemap exclusions, and
missing translated recovery copy.

The first build hit a Google Sheets timeout; a retry with live data completed.
The final build produced 89 pages including the root redirect and error page.
Canonical/hreflang validation passed for all 87 indexable pages. No production
publish, Search Console submission or visibility guarantee is implied.

## References

- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google robots.txt guidance](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)
- [Google HTTP status guidance](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes)

`welcome.html` remains classified as a landing campaign following campaign
architecture, not as a separate main-site feature. The earlier erroneous
deferral statement was corrected in project rules. Its implementation is not
part of this focused SEO task.
