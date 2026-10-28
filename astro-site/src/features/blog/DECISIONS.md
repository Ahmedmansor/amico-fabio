# Blog decisions

Updated: 2026-10-28. These are design decisions, not implementation evidence.

## Fixed decisions

| ID | Decision | Reason / source |
| --- | --- | --- |
| B01 | Static Astro, Tailwind and scoped vanilla browser code | Repository architecture; no server deployment |
| B02 | Feature data / pure domain / presentation layers | Repository rules; test business logic independently |
| B03 | Use shared IT/EN language configuration and dictionaries | One definition of locale/direction and matching UI keys |
| B04 | Article directory contains index.md and its images | Owner's co-location request; fewer authoring path errors |
| B05 | Per-version immutable ID, optional translationKey, folder-based slug | Identity survives route changes; translations can use different slugs |
| B06 | City/interest lists use stable slugs; article URLs are flat | Changing taxonomy must not change article URLs |
| B07 | linkKeywords are target-ownership hints, not SEO keyword restrictions | Avoid ambiguous generated links without restricting editorial vocabulary |
| B08 | Duplicate keyword diagnostics identify both files and language | Owner's authoring usability requirement |
| B09 | Reuse shared functional shell integrations, SEO validator and sitemap | Preserve one SEO system without inheriting old blog styling |
| B10 | Navigation fallback and hreflang equivalence are separate | Blog-home fallback is not a translation of an article/listing |
| B11 | Inquiry reviews details and opens WhatsApp only | Explicit latest owner instruction; follows the tour interaction pattern |
| B12 | No inquiry database, email adapter, API, mock success or stored consent | WhatsApp-only scope replaces the attachment's leads proposal |
| B13 | No invented article prices/totals or infant-age policy | Articles are general inquiries; actual tours own booking policies/prices |
| B14 | Test posts stay visibly marked and blocked from production | Repository migration discipline and attachment fixture scope |
| B15 | No real facts/author identity invented; generated imagery stays labeled temporary | Owner supplies/approves real editorial material |
| B16 | Preserve existing combined Node/Vitest test runner | Do not replace project tests with a blog-only command |
| B17 | Implementation now authorized after the preparation commits | Owner subsequently said to execute |
| B18 | Use ui-ux-pro-max for a fresh blog design, unconstrained by the old site's styling | Latest explicit owner correction supersedes earlier visual-preservation guidance for this feature |
| B19 | Generate temporary article/city/interest visuals and use WebP at stable source paths | Owner's approved image workflow; assets can be replaced later |
| B20 | Use the owner's shared theme.css palette for blog and future site work | Explicit owner palette; ui-ux-pro-max guides layout/usability within these colors |
| B21 | Focused blog checks per task; batch broad builds/checks at integration milestones | Owner explicitly rejected repeated broad checks and unrelated feature testing |
| B22 | Finish article layout and WhatsApp interaction together before their browser acceptance, then complete linking/SEO/catalog polish | Avoid recapturing incomplete dialog/form UI; keep independent pure tests focused and record actual delivered scope |

B18 applies to the blog. It does not authorize restyling the legacy site or all
other Astro pages. Preserve shared behavior and keep new visual CSS scoped.
B19 requires a temporary/generated asset inventory and guarded fixture usage;
generated visuals are not proof of a real scene or approved publication imagery.

## Implementation hypotheses to verify

These are preferred approaches, not proven compatibility claims.

| ID | Preferred approach | Required proof before relying on it |
| --- | --- | --- |
| H01 | Verified: native Astro 7 Sätteri transforms | Colocated images produce WebP/srcset/dimensions after figure/link/CTA transforms; see qa/blog/PHASE_1.md |
| H02 | Verified prototype: metadata-first, then rendered-store pass | glob collects validated entries; supported renderMarkdown creates final HTML; derived HTML must participate in digest for dev updates |
| H03 | Extend alternate-path props through shared layout/header | Existing routes unchanged; translated and missing equivalents work |
| H04 | Shared or public country-data interface | No presentation-to-presentation dependency or duplicated business data |
| H05 | Two inquiry mount points with shared in-memory draft | Unique IDs, resize/dialog continuity and no duplicate handlers |

If H01 fails, record the minimal failing case and evaluate the supported unified
processor. Pin/document any required dependency. Do not change Astro versions as
a routine workaround. If other hypotheses fail, choose the simplest compatible
solution within PLAN.md and record the resulting decision/evidence.

Phase 1 decision: retain native Sätteri; pin `@astrojs/markdown-satteri` 0.4.3 as
a direct dev dependency (already installed transitively by Astro 7.3.8). Do not
use manual Vite graph manipulation for the index. The verified prototype stores
rendered HTML after all metadata exists, with digest including derived output;
Astro then owns data-store invalidation. Its current full rerender-on-metadata
change is a correctness baseline for development, not a production optimization
claim. Full publication validation/filtering remains phase 3/4 work.

## Pending only for affected publication work

- Author identity and appropriate Person/Organization attribution.
- Approved real article copy, native Italian review and image rights.
- Relevant localized legal explanation for opening the WhatsApp conversation.

Technical fixtures may proceed when implementation is requested. These inputs do
not justify inventing real author/content data or reopening the backend decision.

## Change record template

For a future material change, append:

```text
Date / decision ID:
Requirement or hypothesis affected:
Observed limitation (with evidence):
Chosen solution and alternatives considered:
Affected files / checks / commit:
Scope or user input needed, if any:
```
