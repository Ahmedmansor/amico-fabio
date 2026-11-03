# Editorial expansion — implementation evidence

Later change, 2026-10-29: planner cards now open the implemented standalone
planner, and reading links/cards open new tabs. The older contact/navigation
results below describe this report's original revision. Latest evidence is
qa/trip-planner/IMPLEMENTATION.md; the reusable scripts reflect the newer flow.

2026-10-28; existing Astro migration branch. No legacy/main, hosting, remote
catalog or Auth settings were changed. This extends the previous technical blog
handoff; the earlier Lighthouse scores do not measure this new revision.

Delivered:
- Shared editorial document shell, authored native H2/H3 reading index and
  optional article-specific FAQ, with native anchors and visible keyboard focus.
- Exactly one main contact card per article: after its first body figure,
  counting the hero as the first visible editorial image; natural short fallback.
  The card keeps the current WhatsApp review/handoff, not a saved-itinerary claim.
- Separate places feature with pure tested hierarchy and localized clean routes.
- Native two-collection metadata barrier before either collection renders;
  validated target snapshots and debounced cross-collection dev refresh.
- post/place/tour/package references, curated automatic ownership and rejection
  of unknown/unpublished/foreign or ambiguous destinations.
- 6 EN + 6 IT original natural demo articles from the owner's titles, with no
  fabricated translation equivalence. 9 place identities in both languages.
- Actual catalog tours/packages in guide sidebars, accessed through their owning
  functions; no copied competitor product, price, rating or photo.

## Real focused outputs

External Node 24.21.0, commands from astro-site/:

```
vitest run src/features/blog src/features/places
Test Files 10 passed (10); Tests 82 passed (82)
npm run check:blog
tsc --noEmit --project scripts/blog/tsconfig.json
exit 0
```

After adding the demo-protection / FAQ schema test:

```
vitest run src/features/blog/data/__tests__/content.test.ts
Test Files 1 passed (1); Tests 21 passed (21)
node --test src/features/blog/data/__tests__/guard.test.mjs scripts/blog/check-links.test.mjs
tests 11; pass 11; fail 0
node --test --test-name-pattern="place guide" src/shared/seo/__tests__/build-seo.test.mjs
tests 1; pass 1; fail 0
```

This includes natural-looking fixture route leaks, hierarchy cycles, hidden/
foreign references, all four target kinds, manual suppression and native TOC
extraction without injected CTA headings. No unrelated feature suite was run.

```
node scripts/editorial/verify-alias-refresh.mjs
PASS: a guide alias edit rerenders its blog link; original source and working link restored.
node scripts/editorial/capture-editorial.mjs <Playwright> <Chrome>
PASS: 10 editorial captures; reading anchors, optional FAQ, one second-image CTA, products and responsive layout.
PASS: actual article → place guide → existing product navigation (/en/tours/cairo_plane_flexible_museum/).
```

10 cases cover EN/IT articles and guides at 375/1280px and two article variants
at 768px. All had one H1, real TOC fragments, no horizontal overflow or broken
loaded images, zero page errors, one correctly placed contact card and valid
resolved links. FAQ appears where authored and is absent in the glossary.
Screenshots were captured after necessary-only cookie consent, then inspected.
Local full-page screenshots are ignored; JSON/scripts are tracked.

The shared shell extraction initially needed a dev restart to clear Vite's
transient missing-import cache while new files were being created. Native
collection source and canonical link behavior then worked without a renderer
cycle. No circular collection lookup or network request runs inside a visitor.

## Grouped Astro / static artifact checkpoint

```
npx astro check --tsconfig scripts/blog/tsconfig.json
Result (62 files): 0 errors; 0 warnings; 1 hint
```

The unused filter-parameter hint was corrected afterwards. No second broad
Astro check was run just to reprint a zero-hint result. The first build's link
guard caught omitted technical taxonomy routes; that real failure was fixed
before the successful preview artifact below. No failed check is called a pass.

Noindex-fixture build (process-only PUBLIC_AUTH_PASSWORD_ENABLED=0):

```
169 page(s) built in 14.17s
Test flavor: all content is noindex; sitemap has no indexable URLs
Checked 228 generated text files; fixture artifact policy verified
Checked links and metadata structure on 70 editorial pages
Verified visible-content JSON-LD contract on 50 editorial pages
Complete! exit 0
```

The local contract validator distinguishes BlogPosting from place WebPage and
checks visible names/descriptions, canonical/language, dates, image files and
actual breadcrumbs. It is not an external Google rich-results validation or
indexing/GEO claim. No new performance score is claimed for this expanded set.

Normal-production-policy build (PUBLIC_NOINDEX empty, BLOG_INCLUDE_FIXTURES=0,
process-only PUBLIC_AUTH_PASSWORD_ENABLED=0):

```
101 page(s) built in 12.31s
Verified canonical and reciprocal hreflang for 92 indexable pages
Checked 160 generated text files; fixture artifact policy verified
Checked links and metadata structure on 2 editorial pages
Verified visible-content JSON-LD contract on 0 editorial pages
Complete! exit 0
```

This proves natural-looking demo articles/guides do not reach the production
artifact. Build guards also scan generated JS/JSON/XML/CSS/text and source-route
references, not just visible markers. Nothing was deployed. Local environment
files and hosting variables were unchanged. The local dev preview is restored
with fixture/noindex policy for the owner's review.

## Final local handoff

```
node scripts/editorial/verify-contact-entry.mjs <Playwright> <Chrome>
PASS: guide desktop CTA and article mobile action open the existing inquiry dialog; Escape/focus work and no WhatsApp request occurs.
```

EDITORIAL_CONTACT.json records those two new entry-point checks. The underlying
WhatsApp validation/review/message tests remain in the focused blog suite; no
real inquiry/message was sent and no future planner/subscription form was added.

Focused implementation commit: 1a821ea. Independent preview-content commit:
8e0064d. Final scripts/reports/progress documentation are recorded separately.

Ready local paths:
- /en/blog/common-tourist-traps-egypt/
- /it/blog/pianificare-viaggio-egitto-2027/
- /en/egypt/giza-pyramids/
- /it/egypt/luxor/
- /en/egypt/ and /it/egypt/ for the place hierarchy.

The owner can replace the temporary colocated WebP images and later approve
real publication copy/identity. The future separate planner, subscriptions,
external rich-results validation and any deployment remain separate work.

## Original preview content and sources

No competitor content/images were copied. Existing seven approved temporary
generated illustrations were reused as colocated WebP sources, with explicit
illustrative captions; existing catalog photos remain on their real products.
The normal home/discovery view prefers natural demo copy; older technical
fixtures keep their valid direct routes and necessary taxonomy destinations.

Primary background references reviewed during original drafting:
- UNESCO pyramid fields: https://whc.unesco.org/en/list/86/
- UNESCO ancient Thebes: https://whc.unesco.org/en/list/87/
- UNESCO Nubian monuments: https://whc.unesco.org/en/list/88/
- Official GEM FAQ: https://gem.eg/en/faqs
- Official GEM ticketing: https://tickets.gem.eg/
- PADI site overview: https://blog.padi.com/top-10-dive-sites-in-egypt/
- Regional current weather source: https://weather.metoffice.gov.uk/world/egypt

Copy uses original planning prose and limited historical context. It does not
invent a real author/travel diary, quote live ticket prices, promise activity
inclusions or substitute for current operator/government requirements. Preview
protection still applies even when titles and slugs look ready for a live site.
