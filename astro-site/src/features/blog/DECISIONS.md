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
| B09 | Extend the existing shell, SEO validator and sitemap | Prevent duplicate generators and preserve current pages |
| B10 | Navigation fallback and hreflang equivalence are separate | Blog-home fallback is not a translation of an article/listing |
| B11 | Inquiry reviews details and opens WhatsApp only | Explicit latest owner instruction; follows the tour interaction pattern |
| B12 | No inquiry database, email adapter, API, mock success or stored consent | WhatsApp-only scope replaces the attachment's leads proposal |
| B13 | No invented article prices/totals or infant-age policy | Articles are general inquiries; actual tours own booking policies/prices |
| B14 | Test posts stay visibly marked and blocked from production | Repository migration discipline and attachment fixture scope |
| B15 | No real article facts, author identity or imagery invented | Owner supplies/approves real editorial material |
| B16 | Preserve existing combined Node/Vitest test runner | Do not replace project tests with a blog-only command |
| B17 | Documentation/scaffolding now; implementation later | Latest owner instruction explicitly prohibits implementation now |

## Implementation hypotheses to verify

These are preferred approaches, not proven compatibility claims.

| ID | Preferred approach | Required proof before relying on it |
| --- | --- | --- |
| H01 | Native Astro 7 Sätteri transforms | Optimized local images survive figure/link/CTA transforms |
| H02 | One validated publication snapshot/index | Supported collection/render ordering, no cycle, correct dev invalidation |
| H03 | Extend alternate-path props through shared layout/header | Existing routes unchanged; translated and missing equivalents work |
| H04 | Shared or public country-data interface | No presentation-to-presentation dependency or duplicated business data |
| H05 | Two inquiry mount points with shared in-memory draft | Unique IDs, resize/dialog continuity and no duplicate handlers |

If H01 fails, record the minimal failing case and evaluate the supported unified
processor. Pin/document any required dependency. Do not change Astro versions as
a routine workaround. If other hypotheses fail, choose the simplest compatible
solution within PLAN.md and record the resulting decision/evidence.

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
