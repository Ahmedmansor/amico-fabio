# Editorial system expansion — owner review, 2026-10-28

Later scope update, 2026-10-29: the owner authorized the standalone Egypt planner
and new-tab content links. See ../trip-planner/PLAN.md. Its implementation
supersedes the planner deferral / temporary contact-card action below; newsletter
and WhatsApp-channel subscriptions remain deferred.

Status: implemented locally after the owner's execution authorization. This
document records the agreed expansion requirements; progress and actual evidence
are in EDITORIAL_EXECUTION.md and qa/blog/EDITORIAL_IMPLEMENTATION.md. It supersedes
conflicting targets in the original PLAN.md. No database or deployment change
belongs to this expansion; realistic design content remains guarded/noindex.

## 1. Three content/product roles

| Role | Purpose | Localized example |
| --- | --- | --- |
| Blog article | Audience-specific editorial question, experience or comparison | /en/blog/exploring-cairo-beyond-giza/ |
| Place guide | Durable reference for a country, region, city or landmark | /en/egypt/luxor/ and /it/egypt/luxor/ |
| Tour/package | Existing bookable product with its own catalog details | /en/tours/{existing-slug}/ and /en/packages/{existing-slug}/ |

A city guide is not a blog taxonomy listing. /en/blog/destinations/luxor/ remains
an article filter; /en/egypt/luxor/ explains the place and links its landmarks and
real products. Do not duplicate the complete body between those routes.

Use the shared locale prefix, static Astro and trailing slash throughout. The
reference site's /egypt/luxor URL inspires a clean path, not removal of the
existing locale convention. Italian remains the site's default language.

## 2. Language and first demo selection

IT and EN are independent editorial collections. Similar subject matter does
not make two articles translations. Set translationKey/hreflang only for actual
equivalent versions. Unpaired blog articles may navigate to the other language's
blog home through the switcher without claiming that home as an alternate.
Place-guide equivalents about the same place may be genuine translations.

Start with six original demo articles per language, selected from the owner's
titles. Keep the exact supplied titles, reviewing any length limits explicitly
rather than silently truncating them. The initial selection stays within Egypt;
Dubai, Jordan and Azerbaijan are possible later editorial topics, not new
destination products implied by this task.

| Language | Owner's title | Layout/interaction coverage |
| --- | --- | --- |
| EN | 10 Common Traps Tourists Fall Into in Egypt (And How to Dodge Them) | Numbered sections, useful summary table, selected FAQ |
| EN | Exploring Cairo Beyond Giza: The Insider’s City Guide | Links to Cairo/landmark guides and existing products |
| EN | When to Go to Egypt: A Month-by-Month Breakdown of Weather and Crowds | Seasonal sections and an appropriate comparison table |
| EN | Soaring Over Ancient Thebes: The Complete Luxor Hot Air Balloon Guide | Focused guide, Luxor/landmark links, conditional FAQ |
| EN | Traditional Nile Cruise vs. Dahabiya: Which Boat Suits Your Travel Style? | Comparison, distinct reading sections, relevant place links |
| EN | Diving the Red Sea: 7 Unmissable Underwater Spots in Egypt | Image-led list, related Sharm/Red Sea content and tours |
| IT | Pianificare un Viaggio in Egitto nel 2027: La Guida Definitiva e i Consigli Pratici | Planning-led Italian article with a clear reading index |
| IT | Errori da Evitare in Egitto: Regole di Comportamento e Consigli per i Turisti | Italian audience framing, selective table/FAQ |
| IT | Visitare l'Egitto ad Aprile: Perché la Primavera è il Periodo Perfetto per Partire | Seasonal article without a compulsory comparison block |
| IT | Dentro il Grande Museo Egizio del Cairo: Cosa Vedere nella Nuova Casa dei Faraoni | Museum/place reference and image-led reading |
| IT | Piccolo Dizionario di Arabo Egiziano: Le Parole e Frasi Utili per il Tuo Viaggio | Vocabulary/list/table layout with local overflow handling |
| IT | Cosa Mangiare in Egitto: Guida ai Piatti Tradizionali e allo Street Food Locale | Food-led Italian article with distinct content structure |

The owner authorizes natural demo copy for design/testing. Write original prose,
not copied competitor text. Use natural headings/body length/images and meaningful
cross-references; remove repetitive technical filler from the normal design
review set. Retain earlier technical fixtures for edge-case tests separately.

All new demos remain fixture:true, noindex and excluded from production outputs,
even when their titles/slugs look real. Keep a clear page-level preview notice
instead of placing [FIXTURE] in every title/paragraph. Do not invent a real
author, actual personal trip testimony, prices, product offers or verified current
entry/safety/operating rules. Either verify necessary real facts with primary
sources at drafting time or leave changeable specifics out of demo copy.
AI illustrations remain labeled/replacement-ready WebP per ASSETS.md.

## 3. Blog article template

1. Breadcrumbs, title, short introduction, visible author/preview identity and dates.
2. Hero image with explicit dimensions and optimized responsive sizes.
3. **In this article / In questo articolo** in every article: generated from the
   authored H2/H3 hierarchy, linked to unique native heading IDs. Do not collect
   injected CTA/sidebar headings. Anchor offsets account for the sticky header;
   keyboard focus, direct fragment URLs and browser Back remain usable.
4. Readable original content: paragraphs, lists, figures/captions and tables only
   where the article needs them. No compulsory Mistake → Fix table.
5. Shared **Customize Your Dream Vacation!** contact card after the second visible
   editorial image, counting the hero as image one: after the first body image.
   Logos/sidebar/product thumbnails do not count. This preserves the existing
   first-body-figure insertion rule while documenting what the reader sees.
   Insert only once; for genuinely short/no-body-image articles use the existing
   natural fallback, without manufacturing an image for a layout condition.
6. Optional article-specific FAQ, not the same questions everywhere. Native
   details/summary is sufficient; keep complete answers in static HTML.
7. Related articles selected by actual topic/place relevance and current language.

The future vacation-planning page is deferred. The contact card uses the existing
WhatsApp review/handoff until a real planner exists; do not introduce a dead URL
or imply an itinerary was saved/submitted. Keep main-site inquiry behavior
WhatsApp-only, with no new Supabase/email storage.

Newsletter subscription and a WhatsApp-channel subscription module are deferred.
Do not publish inactive email forms, invented channel URLs or subscription claims.

Design uses ui-ux-pro-max guidance within the owner's existing navy/orange palette,
local fonts, breathing room and clear links. The reference's dark screenshot is
not an instruction to copy colors, text, branding, discounts or product design.

## 4. New places feature

Create src/features/places/{data,domain,presentation} and a separate Markdown
collection under src/content/places/{lang}/{slug}/index.md with colocated images.
Thin pages assemble /{locale}/egypt/{slug}/; a country hub may use /{locale}/egypt/.

Domain model: stable placeId, kind (country/region/city/landmark), parentPlaceId,
localized slug/title/summary, publication metadata, actual translation identity,
explicit relatedTripIds and relatedPackageIds. Validate unknown/cyclic parents,
duplicate routes/IDs, image metadata, locale and missing product references.
Do not infer a relationship merely from a matching display word.

Start with the Egypt hub, Cairo, Luxor, Aswan and Sharm; seed landmark guides for
Giza Pyramids, Karnak, Valley of the Kings and the Grand Egyptian Museum as needed
by the selected articles. This establishes the model, not a promise that every
Egyptian landmark already has approved content. Add real pages incrementally.

Desktop layout: a generous reading column on the left and a narrower related
travel column on the right (roughly 2:1, not an equal split that cramps text).
The sidebar contains a compact place hierarchy and a small explicit selection
of published tours/packages. Do not make a long product list a fixed-height
scroll trap. At mobile widths, stack content/products naturally and preserve
the reading order. Hide empty recommendation blocks rather than showing fake
offers or large blank placeholders. Existing blog WhatsApp controls stay on
blog pages; guide sidebars emphasize relevant real products.

Product cards obtain actual locale title/image/route and, if displayed, the
existing final starting price through getTrips()/getPackages(). Never copy the
reference site's prices/ratings/packages or create a 10-day Fabio product merely
because the reference has one. Reuse existing booking detail routes; no product
page redesign is part of this expansion.

## 5. Unified editorial links

Build a validated target registry containing kind, stable ID, locale, canonical
path, title and explicitly owned aliases for post/place/tour/package targets.
All product access goes through owning feature data functions. Domain matching
remains pure; no network or Astro calls inside the matcher/AST visitors.

- Mentioned full blog titles retain the existing automatic behavior.
- Place titles/localized aliases such as Pyramids or Luxor lead to place guides.
- Authors can explicitly link existing tours/packages in ordinary prose.
- Optional automatic product aliases are deliberately configured, not a broad
  replacement of arbitrary words with commercial links.
- Proposed durable authoring references: [Pyramids](place:giza-pyramids),
  [chosen title](tour:existing-stable-id), [chosen title](package:existing-id).
  Resolve to real localized URLs during build; unresolved pseudo-links must fail
  and never reach HTML. Ordinary valid local Markdown links remain supported.
- Preserve longest-overlap matching, same-language publication rules, manual-link
  exclusion, one automatic link per target, maximum five and excluded AST nodes.
- A target may deduplicate its own title/alias. Ambiguous automatic aliases across
  different targets name both owners; do not silently choose a guide, blog or
  product by an arbitrary type priority. Explicit references resolve author intent.

Cross-collection metadata must exist before any affected content is rendered.
Prove one small native pipeline case first, then extend the validated snapshots:
no circular collection queries or network access from Markdown plugins. Verify
that editing a guide alias invalidates affected blog output in development.

## 6. SEO and content ownership

Keep one shared head/sitemap/robots system. Use accurate BlogPosting only for
actual article-shaped pages; choose WebPage/Article as appropriate for place
guides, with BreadcrumbList describing their actual hierarchy. Article filters
do not become canonical equivalents of city guides. No fake reciprocal hreflang
between audience-specific IT/EN posts. Only existing translated equivalents link.

FAQ answers are useful visible content; do not promise Google FAQ rich results.
Natural headings, clear place identity, sources and real future author/reviewer
identity support SEO/GEO readiness without guaranteeing rankings or AI citations.
The entire design dataset remains a noindex preview, not indexing evidence.

## 7. Focused execution order

| Step | Deliverable | Acceptance |
| --- | --- | --- |
| E1 | Finalize revised content contracts and prove one blog → place → existing product chain with native processing | Stable refs, actual localized routes, no renderer cycle and alias edit reflected in dev |
| E2 | Reusable article TOC and optional FAQ; CTA placement/wording contract | Correct authored H2/H3 anchors on mobile/desktop, no CTA pollution, exactly one correctly placed contact card |
| E3 | Places feature, validated hierarchy and responsive guide template | One city and one landmark demo with real catalog cards; no made-up product data |
| E4 | Expand link registry/resolution to all four kinds | Explicit references and automatic claims validated; hidden/unknown/foreign targets rejected |
| E5 | Write selected six EN + six IT realistic design articles and supporting guide copy/assets | Distinct audience topics, original varied content, useful links, all demos protected from production |
| E6 | Editorial discovery/navigation and grouped acceptance | Blog/guide/product journey works, actual alternates, focused responsive captures and artifact guards |

Perform only tests relevant to each changed behavior. One grouped Astro check
and preview/production artifact checkpoint follows coherent integration, not each
paragraph/heading/image edit. Preserve earlier unrelated feature work. Inspect
diffs and commit focused steps. Deployment, the future planner and subscriptions
remain outside this expansion.

## References and review observations

The owner's five supplied screenshots are layout references, not application
instructions. Reviewed the linked Pyramids, Luxor and 10-day-product pages; the
blog URL initially failed direct fetching but its search-indexed content and
the owner's screenshots exposed the relevant structure. No page text/images
were imported. The initial ui-ux-pro-max system search returned a conversion/
testimonial pattern that does not fit this reading view; it was not adopted.
The narrower UX search supports mobile table containment, sticky-header offsets
and keyboard navigation; the editorial layout is an explicit design judgment.

- https://www.memphistours.com/blog/mistakes-to-avoid-in-egypt
- https://www.memphistours.com/egypt/pyramids
- https://www.memphistours.com/egypt/luxor
- https://www.memphistours.com/egypt/round-trip-nile-cruise-and-pyramids
