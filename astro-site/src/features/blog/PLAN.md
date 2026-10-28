# Blog system — implementation plan

Status: original technical implementation is complete locally, including the
title-link correction. The owner's subsequent editorial/places design expansion
is specified in EDITORIAL_REVISION.md; those new targets are not implemented yet.
Updated: 2026-10-28.

Planning package: see README.md for the documentation map and EXECUTION.md for
the ordered implementation checklist. The owner subsequently authorized execution.
Latest same-day visual direction: use ui-ux-pro-max for a fresh blog design,
using the owner's approved shared palette in `src/shared/styles/theme.css`,
without inheriting the current site's visual design. Temporary AI-generated WebP
article/taxonomy images are approved for replacement by the owner later.

## 1. Purpose and authority

Build a static Italian/English blog for Fabio Egypt, using the application's
existing feature-first data / domain / presentation architecture. Owners author
Markdown and local images; Astro generates readable HTML at build time.

This document incorporates the owner's BLOG_SYSTEM.md proposal, the repository
review, and the owner's latest clarification: **the blog form only prepares a
WhatsApp conversation, like the existing tour booking flow. It has no Supabase
integration.** The attachment is a design reference; current user instructions
and repository AGENTS.md govern execution and authorization.

The initial documentation-only task is complete. The owner's later instruction
authorizes implementation following these phases, with a focused verified commit
and progress report per completed task. Do not introduce repeated routine
approval gates from the attachment.

## 2. Goals and measurable outcomes

- Author an article and its images in one directory, using a documented template.
- Publish independent IT/EN static pages; Italian remains the shared default.
- Organize articles by city and interest, with stable article URLs independent
  of taxonomy changes.
- Link only actual published translations, related articles and existing tours.
- Reject incomplete metadata, invalid references and ambiguous linking rules
  before publishing, identifying the record and field involved.
- Offer a readable desktop/mobile article layout and a WhatsApp inquiry flow.
- Reuse shared languages, contact configuration, dictionaries and SEO; design a
  new blog-specific visual shell using ui-ux-pro-max.
- Keep test articles out of production artifacts through enforced build guards.
- Support search discovery and machine understanding through accessible HTML,
  accurate metadata, structured data and trustworthy future editorial content.
- Preserve the legacy site, current Auth/wishlist behavior and catalog behavior;
  the new visual direction applies to blog pages, not a site-wide redesign.

## 3. Confirmed repository baseline

Read-only inspection on 2026-10-28 found:

- Current branch: `try-to-refactoring-to-astro`; work remains on this branch.
- Installed Astro and package manifest: `7.3.8`, not the proposal's Astro 5.
- Static output and `trailingSlash: 'always'` already configured.
- Node is pinned to `24.21.0`; use the external runtime per existing setup.
- Shared locales/direction/OG locale: `src/shared/config/languages.ts`.
- Shared public WhatsApp/contact information: `src/shared/config/site.ts`.
- Existing shell: `BaseLayout.astro`, `Header.astro`, `Footer.astro`. These are
  functional integration references, not the approved visual direction for blog.
- Header already has a Blog item pointing to `#`; wire it when routes are ready.
- `PageHead.astro` supports alternate paths, but BaseLayout and Header need to
  forward a page-specific alternate map.
- `src/shared/seo/build-seo.mjs` already generates sitemap/robots and validates
  metadata; its same-path bilingual assumption needs translation-aware support.
- Legal pages exist at `/it/legal/` and `/en/legal/`; review their relevance to
  the WhatsApp handoff before selecting a localized explanatory link.
- Tour access exists through `features/tours/data/trips.mjs:getTrips()`.
- Tour booking validates inputs, shows a review modal and opens an encoded
  `https://wa.me/` URL using the shared number. This is the behavioral reference.
- `npm test` runs Node tests and Vitest; preserve this combined runner.

These observations are planning evidence, not proof that blog functionality or
its future checks pass. No dependencies or hosting settings are changed here.

## 4. Scope and exclusions

Included: blog home, paginated city/interest listings, articles, images/captions,
reading time, featured article, related articles, manual/automatic links,
translation-aware navigation/SEO, optional explicit related-tour card, WhatsApp
inquiry UI, authoring assistance, fixtures and verification scripts.

Initial cities: `cairo`, `luxor`, `aswan`, `sharm`.
Initial interests: `history`, `diving`, `desert`, `food`, `tips`, `stories`.
Each article has zero or one city and one or two distinct interests.
Egypt is the geographic scope; no country taxonomy level is needed.

Excluded: a blog CMS, remote article database, Supabase lead tables/adapters,
Edge Functions for inquiries, email delivery, account requirements, marketing or
reminder consent, comments, search, RSS, additional languages, a global redesign,
production deployment and fabricated real travel facts/prices/author biographies.
The blog itself has an approved fresh design; redesigning other site pages is
outside this feature.
Existing Supabase-backed tour catalog access remains owned by the tours feature;
the blog does not introduce a new provider or direct catalog queries.

## 5. Architecture and file ownership

Target structure (future files, not an implementation inventory):

```text
src/features/blog/
  PLAN.md
  AUTHORING.md
  QA.md
  domain/
    models.ts
    taxonomy.ts
    publication.ts
    translations.ts
    related-posts.ts
    internal-links.ts
    inquiry.ts
    validation.ts
    __tests__/
  data/
    content-schema.ts
    posts.ts
    publication-context.ts
    taxonomy-content.ts
    authors.ts
    did-you-know.ts
    related-tours.ts
  presentation/
    components/
    pages/
    markdown/
    scripts/
    styles/

src/content.config.ts
src/content/blog/{lang}/{slug}/index.md
src/content/blog/{lang}/{slug}/hero.jpg
src/pages/[locale]/blog/...
scripts/blog/...
```

- **Domain:** ordinary types and pure rules only. No Astro APIs, file reads,
  environment access, network, DOM, storage or data/presentation imports.
  Publication rules receive articles, an explicit evaluation time and a policy.
  Related-article scoring, keyword matching, validation and WhatsApp message
  generation are independently unit-tested.
- **Data:** reads content through Astro's content layer, validates/maps it into
  domain models, resolves assets and build context, and calls other features'
  public data functions for cross-feature references. Never bypass getTrips().
- **Presentation:** Astro components, scoped styles, Markdown rendering
  transforms and small browser interactions. A pure linking algorithm can live
  in domain; AST mutation and CTA markup belong here.
- **Routes:** obtain data through the data layer and compose presentation only.
- **Shared:** language configuration/direction, IT/EN UI dictionaries, public
  contact number, analytics and SEO remain shared single sources. Reuse neutral
  document functionality while keeping the new blog theme/shell scoped; do not
  automatically inherit old main-site visual CSS.
- `src/content.config.ts` registers the collection using the feature's data
  schema. Do not let it become a second home for business rules.

## 6. Content model and authoring

### Colocated content

Use `src/content/blog/it/guida-al-cairo/index.md` with `./hero.jpg` and body
images beside it. Collect only entry Markdown files, not image files. Use Astro's
supported glob loader and an explicit identity mapping where needed; do not
assume the generated entry ID is the public slug or exposes an `/index/` suffix.

Each language version has an immutable `id`, independent of its folder/slug.
`translationKey` groups true translations and is optional. Post slugs can be
translated and differ between languages; translations need not exist together.

Required metadata: `id`, `title`, `description`, `pubDate`, `lang`, `interests`,
`heroImage`, `heroAlt`. Optional metadata: `translationKey`, `destination`,
`updatedDate`, `heroCaption`, `linkKeywords`, `featured`, `relatedTripIds`,
`authorId`. `draft` and `fixture` default to false.

Initial validation follows the proposal's title 10–110 characters, description
50–160, nonempty descriptive hero alt (minimum 5), and keyword minimum 4.
These are editorial constraints, not claims about Google's ranking limits.
Dates must parse; updatedDate cannot precede pubDate. Compare publication time
against one captured build time with documented date-only/timezone semantics.

### Validation contract

Fail on missing fields/assets, invalid taxonomy values, duplicate article IDs,
duplicate slugs within a language, duplicate translationKey within a language,
folder/lang mismatch, reserved slugs (`page`, `destinations`, `interests`),
invalid author/tour references, duplicate interests and invalid image alt text.
IDs are globally unique across entries; translated entries use distinct IDs.

The full visible article title automatically identifies its target when mentioned
in eligible body text. `linkKeywords` add alternative phrases for the same target;
they are not exclusive SEO topics and do not prohibit repeating words in text.
Normalize Unicode consistently, trim/collapse whitespace and match case
insensitively while keeping accents significant. Reject duplicate claims within
a language among published articles, including equivalent spellings after that
normalization, including title-versus-keyword collisions. A phrase shared by the
title and keywords of the same article is deduplicated. Diagnostics name the
phrase, language and both source files. This title behavior was clarified by the
owner during visual review after the first technical handoff.

Keep publication filtering identical for page generation, related content,
translation maps and automatic links. Validate structural integrity for all
entries, including drafts, without publishing them. Future-dated articles remain
unpublished in normal builds; reaching the date requires a successful rebuild.

Provide AUTHORING.md, a copyable frontmatter template and a local `blog:new`
scaffold that validates inputs and never overwrites an existing article. No CMS
dependency is needed initially. Unapproved author identity/copy is not invented.

## 7. Astro 7 Markdown and image pipeline

Astro 7 uses Sätteri by default; old `markdown.rehypePlugins` examples cannot be
copied blindly. First prove a minimal native pipeline using documented AST hooks:

1. Load/render a colocated Markdown article and optimized local hero/body images.
2. Preserve image optimization while adding figure/caption semantics.
3. Transform automatic links and insert one inline CTA with correct language.
4. Confirm deterministic dev updates and clean builds after content edits.

Prefer the native processor. If its supported interfaces cannot meet a verified
requirement, document the concrete limitation before selecting the supported
`@astrojs/markdown-remark` / unified processor, pinning compatible dependencies.
No framework, Astro upgrade/downgrade or heavy runtime package is implied.

Use one validated publication snapshot/index per build for consumers. Avoid a
second independent frontmatter parser with different schema/filter rules.
Settle the supported loading/rendering order in the prototype; never introduce
a circular dependency between content rendering and collection loading.
Dev changes must invalidate any derived link index.

Use responsive image sizes and explicit dimensions. Hero is eager/high priority;
cards and body images are lazy. Caption convention remains Markdown image title
text; remove a duplicated title tooltip after creating figcaption. Escape all
generated content and safely serialize JSON-LD; authored HTML is trusted local
content, not a public HTML submission surface.

## 8. Routes, publication and language behavior

```text
/{lang}/blog/
/{lang}/blog/page/{n}/                       n >= 2
/{lang}/blog/destinations/{destination}/
/{lang}/blog/destinations/{destination}/page/{n}/
/{lang}/blog/interests/{interest}/
/{lang}/blog/interests/{interest}/page/{n}/
/{lang}/blog/{slug}/
```

Use existing `[locale]` routing and trailing slashes. Nine articles per listing
page; page one has only the base URL. Generate no empty taxonomy/overflow pages.
Blog home exists with a localized empty state when a language has no articles.
Post URLs remain flat so taxonomy changes never change an article URL.

Extend the shared Header/BaseLayout with explicit alternate paths. Preserve
existing behavior for non-blog pages. An untranslated article hides the other
language option. Listing navigation can fall back to the other blog home when
the corresponding listing/page does not exist, but that fallback is **not** an
hreflang translation. Head alternates and switcher destinations are separate
concepts. Add a consistent language-switch marker for validation.

Only real published equivalents participate in hreflang. No cross-language
article/card/CTA links. External reference sources are permitted; language
isolation applies to internal site routes, not the language of external sources.

## 9. Presentation behavior

Blog home: newest featured article (newest article fallback), optional up to
three approved Did-you-know items, active interests, active cities, latest grid
with pagination, closing inquiry CTA. Hide empty sections. Facts are fixtures
until real text is supplied; never publish placeholder claims as travel advice.

Listing: breadcrumbs, one H1, localized intro, cards, pagination and closing CTA.
Article: breadcrumbs/chips, one H1, title/date/author/reading time, 16:9 hero,
article body and desktop sticky inquiry aside, closing CTA, an optional explicit
related-tour card, then up to three related articles.

Desktop >=1024px: `minmax(0, 1fr)` article column plus approximately 380px aside;
reading width about 68ch. Verify ancestor overflow and available viewport height.
Mobile/tablet: hide aside with display:none, show a safe-area-aware bottom action
that opens a named native dialog. Support Escape, focus restoration, scroll lock
and bottom spacing. Coordinate with existing WhatsApp/wishlist/cookie UI to avoid
overlapping controls. Use unique IDs for form instances and preserve draft values
when changing viewport or opening/closing the dialog.

Insert one inline CTA after the first body image's containing top-level block;
the hero does not count. No-image fallback: before the second H2; fewer than two
H2s means no inline CTA. Protect valid HTML for nested images/lists. Share CTA
markup/classes across generated content and Astro components without unsafe
interpolation. CTA opens the mobile form or focuses the desktop form.

Use ui-ux-pro-max to establish the blog's new visual direction and scoped design
tokens derived from the owner's shared palette; do not inherit the old site's
colors, typography or shell styling or invent a competing brand palette.
Keep font loading local. Preserve shared functional integrations without forcing
old visual components into the blog. Do not redesign other site pages as part of
this feature. Support keyboard use, labeled errors, visible
focus, readable tables and reduced motion. New UI copy lives in both shared
IT/EN dictionaries and receives owner/native review before real publication.

### Approved visual workflow and replaceable images

Before implementing blog UI, read the ui-ux-pro-max skill, run its design-system
workflow for a travel editorial blog, inspect the actual matches, and record the
chosen direction and accessibility/responsive rules. Use Astro/Tailwind-specific
guidance. Skill recommendations do not override the WhatsApp-only flow, static
architecture or business behavior. No visual-design output is claimed yet.

At the image phase, use the built-in imagegen workflow for temporary editorial,
interest and city-card visuals. Generate first, then convert/copy workspace
assets to WebP with verified dimensions/quality; never depend on a generator's
external save location at build time. Keep stable semantic source paths such as
`hero.webp` beside articles and taxonomy images in a feature-owned asset folder.
Record asset purpose, source path, dimensions, generated/temporary status and
replacement notes in an asset inventory. The owner can replace assets at the
same source paths; a rebuild regenerates hashed optimized output URLs.

AI-generated visuals are illustrative placeholders, not evidence of real places,
travel experiences or approved production imagery. Keep them in guarded fixture
contexts until reviewed/replaced; never silently label them as verified photos.
After replacement, review alt/caption accuracy, crop, dimensions and rights.
Small deterministic solid/gradient images remain appropriate for technical
pipeline tests; image generation is for the later actual visual asset phase.

## 10. WhatsApp inquiry — no backend

The owner's clarification replaces the attachment's entire leads persistence
proposal. There is no lead repository, SQL, API request, mock sending adapter,
email notification, inbox guarantee or subscription/consent grant in this flow.

Follow the existing tour flow's interaction pattern:

1. Visitor enters name, nationality, intended date, adults and children.
2. Validate required name/nationality/date, valid nonpast calendar date and
   integer counts (adults >=1, children >=0). Reuse existing suitable business
   rules and country data through an appropriate shared/public interface.
3. Destination defaults to the article city when available; allow an undecided
   option. An optional bounded message provides inquiry context.
4. Show a localized review of the entered details before the handoff. This is an
   inquiry summary, not an invoice or a confirmed booking.
5. The explicit WhatsApp action synchronously opens
   `https://wa.me/{sharedNumber}?text={encodedMessage}` using the shared config.
6. Keep a usable link/fallback if a popup cannot open. Preserve entered values.

No required email or phone field: the conversation supplies the contact channel.
No separate infant category, arbitrary age policy, invented price, calculated
total or add-on selection: a general article is not a priced catalog booking.
Use existing approved adult/child wording; a related tour card links to that
tour's actual booking page for real pricing and policies.

Domain functions validate inquiry input and format the localized message from
explicit arguments. Browser presentation handles the review and navigation.
Include the article title and clean canonical URL as context, alongside inquiry
fields; encode once and test Unicode, apostrophes, line breaks and special chars.
The shared number is supplied outside domain; it is never duplicated in blog.
Do not reuse the current booking DOM script unchanged: its fixed IDs and priced
trip assumptions do not fit two article form instances.

UI says that WhatsApp opens with a prepared message and the visitor sends it
there. Never show “request received”, “saved”, “message sent” or promise a reply
because a link opened. Provide a localized privacy link/explanation of the
handoff; do not reuse the old persistence-consent checkbox or imply stored
consent. Review relevant legal copy before real publication.

No personal values in logs, analytics, local/session storage or site URL query
parameters. Form state is in memory only. No UTM storage is required for this
scope. Extend shared analytics for a consent-gated `generate_lead` WhatsApp
handoff event with non-personal article ID/language/channel only; document that
it measures the handoff action, not delivery or completed booking.

## 11. Related articles, tours and automatic links

Related articles: same language, exclude self, +3 for the same nonempty city,
+2 per shared interest, recency then stable ID for deterministic ties. Drop zero
scores and return up to three without cross-language fillers. Reading time:
plain reading text /200 words, rounded up, minimum one minute.

Related tours: explicit stable trip IDs in frontmatter, checked through getTrips().
Resolve current locale's approved title/image/route. Reject unknown IDs. Preserve
catalog visibility rules and never manufacture a translated tour or blog price.
One card initially; record a deterministic frontmatter-order selection rule.

Automatic links run at build time on article body only:

- Own-language published targets only; no draft/future/excluded fixture targets.
- Match full titles automatically; keywords supply additional matching aliases.
- First eligible occurrence; one automatic link per target; maximum five.
- Prefer the longest overlapping keyword with deterministic tie-breaking.
- Preserve displayed casing and accents, with Unicode-aware word boundaries.
- Skip self and any target already manually linked anywhere in the article.
- Skip headings, links, code/pre, captions, buttons, script/style and elements
  marked data-no-autolink; skip generated CTAs too.
- Produce accessible underlined ordinary links; never nest anchors.

Test both the pure selection rules and resulting transformed HTML, including
overlaps, Italian elisions, punctuation and manually linked destination paths.

## 12. SEO, GEO and fixture safety

Extend existing shared SEO rather than create another head/sitemap generator.
Support article OG type and locale alternates, absolute self canonicals, social
images, BlogPosting and BreadcrumbList matching visible content. Use approved
author identity/type; do not invent a Person or biography. Include accurate
publication/modification dates and inLanguage. Validate safely escaped JSON-LD.

Update the existing SEO verifier to accept translated slugs and missing
translations while preserving reciprocal existing-page checks. Pagination is
self-canonical; hreflang never invents missing page numbers. Sitemap includes
actual indexable routes and real equivalents, excluding drafts, fixtures,
noindex pages, redirects and errors. Keep one robots/sitemap owner.

GEO readiness means clear server-generated text, useful headings, direct answers,
real authorship and verifiable sources when real articles are later written.
It does not guarantee AI citations, ranking or indexing. No special AI schema or
llms.txt is required for this phase. Fixture performance is technical evidence,
not proof of editorial quality or search results.

Fixture content is visibly labeled and uses placeholder imagery only. Dev may
include it; preview builds require an explicit build-only opt-in **and** an
approved noindex test context. Do not add PUBLIC fixture configuration to browser
code. A production build rejects fixture opt-in rather than trusting a flag.
Run output guards as part of the relevant build path, not just optional manual
checks. No changes to the legacy GitHub Pages workflow.

Check HTML, serialized/public indexes, sitemap and other generated text for
fixture identifiers/markers and broken references. Fixture pages are noindex
and absent from sitemap. Add negative tests proving forced inclusion fails on
production and proving draft/future/fixture targets cannot leak through links.

## 13. Execution sequence and acceptance

No phase below is complete until its real checks are recorded. Latest owner
instruction: use focused verification for the changed blog behavior and batch
full Astro check/build at coherent integration milestones. Do not rebuild the
whole site after each small task or retest unrelated working features routinely.
This supersedes the earlier per-task broad-check cadence for this work. Review
the diff, stage explicit task files and create focused English commits. Preserve
the combined existing test runner; record which checks actually ran.
Documentation-only tasks use diff/format review; do not claim runtime checks.

| Phase | Deliverable | Acceptance |
| --- | --- | --- |
| 0 | This reviewed plan and repository mapping | WhatsApp-only scope recorded; no runtime changes |
| 1 | Minimal Astro 7 rendering prototype and decision record | Colocated optimized images, caption and AST transforms proven; no public fixture route leakage |
| 2 | Domain models, taxonomy, publication, translation and related helpers | Focused unit tests cover filters, identity, scores, ties and time boundaries |
| 3 | Collection/schema, data access and content validation | Invalid fields/assets/IDs/slugs/keywords fail with file-specific diagnostics |
| 4 | Fixture matrix and enforced environment/output guards | Dev/approved preview works; production excludes fixtures and rejects forced inclusion |
| 5 | Blog home, taxonomy routes, cards and pagination | Nine/page, correct page-one URLs, empty suppression and bilingual empty states |
| 6 | Article layout, captions, CTAs, sticky aside and mobile dialog | Matching 375/768/1280px captures, keyboard/focus and no horizontal overflow |
| 7 | Automatic links and built-output link checker | First occurrence/longest/cap/isolation rules and intentional failure cases pass |
| 8 | Shared alternate-path, SEO and sitemap extensions | Translated slugs/unpaired articles/unequal pagination verified; existing routes preserved |
| 9 | Explicit related-tour integration | Existing IDs, visibility and correct-language routes checked; no copied provider access |
| 10 | WhatsApp form, review UI, message generation and analytics | Validation and encoding tests; browser handoff URL verified without sending a real message |
| 11 | Authoring scaffold/template and documentation | New draft created safely; useful error output; no invented approved content |
| 12 | Final QA and readiness report | Full checks, measured performance, accessibility and fixture isolation evidence |

Dependency note: the minimal shared alternate-path and SEO-validation support
needed for asymmetric blog routes must land before those routes in phase 5/6.
Treat it as an early prerequisite slice of phase 8, with its own verification and
focused commit. Do not knowingly introduce a failing build while waiting for a
later phase. Full article metadata/sitemap/regression acceptance remains phase 8.

For phases 5–6, 8 and 10, capture changed screens at 375, 768 and 1280px.
Screenshots remain local and Git-ignored; commit scripts, comparison JSON and
reports. Since blog pages are new, use the approved spec/current shell as the
baseline; do not claim a legacy blog comparison. Regression-check shared shell
changes against existing IT/EN mobile/desktop pages.

Fixture matrix: translated pairs with different slugs; one-language posts;
empty taxonomy; >9 posts; long/short content; zero/one/multiple body images;
nested image; caption; fewer than two H2s; overlapping/repeated keywords; manual
links; drafts; future dates; special characters; invalid records in isolated
negative-test inputs. Fixtures contain no asserted real travel facts or prices.

Link checker: resolve internal paths and fragment targets, detect language leaks
with explicit switcher/hreflang exceptions, require one H1/canonical and correct
html lang for blog routes, verify image alt and reciprocal real alternates.
Account for existing non-language campaign routes and bilingual 404 semantics;
do not apply new assumptions blindly to the entire site. Record preexisting
issues separately rather than silently ignoring them.

Final measurement targets on blog home and three representative posts:
Lighthouse mobile Performance >=90, Accessibility >=95, SEO >=95, CLS <0.1.
Report measured values and environment; automated scores do not replace keyboard
and dialog walkthroughs. Validate JSON-LD with a named validator and distinguish
syntax/schema validity from search eligibility or actual indexing.

## 14. Decisions needed before real publication

- Approved author display identity and whether Person or Organization is accurate.
- Approved photos/rights, real facts, article text and native Italian copy review.
- Review the existing legal wording for the WhatsApp inquiry handoff.

These do not block technical fixtures or domain work. They block only publication
of affected real content. Do not reopen the WhatsApp-only/backend decision.
Preview/deployment work must follow DEPLOYMENT.md and the authorization applicable
to this feature; the Auth standing authorization is not a blanket blog deployment
permission. No hosting change, push or deployment is part of this planning task.

## 15. References

- Repository: AGENTS.md, PROJECT_MAP.md, astro-site/DEPLOYMENT.md.
- Owner reference: BLOG_SYSTEM.md supplied from Downloads (not a build input;
  this plan is self-contained for a fresh clone).
- Astro 7 Markdown migration:
  https://docs.astro.build/en/guides/upgrade-to/v7/
- Astro content loaders:
  https://docs.astro.build/en/reference/content-loader-reference/
- Astro local/content images:
  https://docs.astro.build/en/guides/images/
- Google AI features guidance:
  https://developers.google.com/search/docs/appearance/ai-features
- Google article structured data:
  https://developers.google.com/search/docs/appearance/structured-data/article

Recheck installed APIs and current official documentation at implementation time.
