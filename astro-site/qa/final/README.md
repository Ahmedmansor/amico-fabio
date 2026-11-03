# Astro migration readiness review

Review date: 2026-10-14. This report describes the migration branch and local
production build; it is not a production deployment or an external-service audit.

## Verified scope

- 90 generated HTML pages: 86 bilingual main-site content pages, Italian-only
  `/offerta-sharm/` and `/welcome/`, a root default-language redirect, and 404.
- 88 indexable canonical pages in the build-generated sitemap. Canonical URLs,
  existing alternate targets and reciprocal hreflang are checked during build.
- 22 trips, 14 packages, 3 addons and 2 settings validated from live Google
  Sheets. Approved legacy defaults remain: 11 blank child-price records use
  zero; 9 blank minima use one; promo active status has no new date gating.
- All 11 feature/catalog/SEO/sharing verification scripts passed. Existing
  desktop/mobile comparison records were revalidated against source content
  and generated files; this is not a claim that all screenshots were recaptured
  in this final audit. Detailed interaction evidence remains in each feature QA.
- 66 Node tests and 96 Vitest tests passed. The final Astro check reported zero
  errors, warnings and hints. Production build succeeded with live catalog data.
- `links.json` audits 90 HTML pages and 6,523 local references: navigation,
  anchors, script/image/style files, responsive image candidates, social images
  and CSS asset URLs. Zero broken local targets remain.
- Unknown URLs return real HTTP 404 in development and production preview;
  `/` leads to the Italian home. No catch-all home redirect was introduced.
- All 72 tour/package sharing pages use the correct original poster, localized
  source title/description, JPEG output and absolute HTTPS metadata URLs.
- Legacy source, root manifests/lockfile and build configuration match `main`
  for the inspected legacy paths. No branch switch, publish or DNS change ran.

## Defect fixed during final review

The shared head used an imported logo's raw metadata URL for favicon and default
share image. That raw file was not emitted by the production image pipeline;
the first audit found 176 missing icon references. The head now obtains an
emitted image through Astro `getImage()`. Final audit also checks default social
images, so both icons and share fallbacks resolve to real generated files.
This changes no visible page design or commercial content.

The existing `public/CNAME` was copied byte-for-byte into `astro-site/public/`
for eventual hosting readiness. The value remains `fabioegypt.com`; copying a
static file does not deploy, alter DNS or authorize a production release.

## Remaining checks and known limits

1. **Welcome lead delivery:** no real lead was submitted to Google Apps Script
   or WhatsApp. An authorized end-to-end submission must confirm the endpoint's
   actual success-response format and receiving sheet before relying on the
   campaign. Domain tests cover recognized acknowledgments, rejection/error
   cases and the original message; they do not prove external delivery.
2. **Public hosting:** after separately authorized deployment, check production
   HTTP 404 behavior, HTTPS/domain, sitemap/robots availability and redirects.
   The current static root redirect is HTML meta refresh, not a server 301.
3. **Facebook/WhatsApp previews:** generated metadata/files pass, but platform
   fetch and cached previews require publicly accessible deployed URLs.
4. **Analytics:** GA4 configuration and privacy-preserving lead code are present;
   live event arrival in the property has not been independently confirmed.
5. **Legacy placeholders:** 172 `#` links remain, largely repeated shared Blog
   and brand/logo placeholders. They are recorded separately from broken URLs.
   No destinations or blog content were invented. Welcome's three review images
   are the source placeholders; its original commercial claims were preserved.
6. **Git history:** prior screenshot history is still present. New QA screenshots
   are local/ignored; destructive history cleanup remains a separate task.
7. **External services:** local tests do not prove Vimeo playback, third-party
   uptime or search indexing. One sharing verification hit a Google Sheets
   timeout; retrying it alone passed with live data. No fallback prices were used.

Legacy details URL compatibility is excluded by user decision. A redesign and
editorial SEO rewrite are outside this migration. No additional dependency was
installed for this final review. The build still reports old Browserslist data;
it is not silently upgraded as part of migration verification.

## Reproduce

From `astro-site/`, with the pinned Node version:

```sh
npm test
npx astro check
npm run build
node scripts/verify-catalog.mjs
node scripts/verify-home-migration.mjs
node scripts/verify-explore-migration.mjs
node scripts/verify-legal-migration.mjs
node scripts/verify-secrets-migration.mjs
node scripts/verify-tour-migration.mjs
node scripts/verify-package-migration.mjs
node scripts/verify-offer-migration.mjs
node scripts/verify-welcome.mjs
node scripts/verify-sharing.mjs
node scripts/verify-seo.mjs
node scripts/verify-site-links.mjs
```

The SEO HTTP verifier expects running local servers on ports 4321 and 4322.
Feature comparison JSON is versioned evidence; screenshot files are intentionally
not part of a fresh Git clone. Keep a separate visual baseline before redesign.
