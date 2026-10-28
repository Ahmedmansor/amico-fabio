# Blog feature

Status: technical implementation complete locally; real editorial publication pending.
Updated 2026-10-28.

A static IT/EN editorial blog with city/interest browsing, translation-aware
links, optimized colocated images and a WhatsApp-only inquiry flow. It follows
the existing data / pure domain / presentation architecture.

## Start here

| Document | Purpose |
| --- | --- |
| [PLAN.md](./PLAN.md) | Scope, goals, architecture, behavior and acceptance contract |
| [EXECUTION.md](./EXECUTION.md) | Ordered implementation tasks and progress/evidence ledger |
| [DECISIONS.md](./DECISIONS.md) | Fixed decisions, implementation hypotheses and publication dependencies |
| [AUTHORING.md](./AUTHORING.md) | Actual authoring commands, format and publication checklist |
| [QA.md](./QA.md) | Verification cases, browser checks and evidence requirements |

PLAN.md owns requirements. EXECUTION.md tracks work. QA.md defines evidence;
it never implies that an unchecked case has passed. Record future deviations in
DECISIONS.md and update affected requirements before reporting completion.

## Current deliverables

- Registered content collection with colocated optimized images and strict validation.
- IT/EN blog home, destination/interest pagination, article pages, related articles
  and explicit published-tour references in a new scoped editorial design.
- Automatic internal links, translated-route SEO, article JSON-LD and build guards.
- 22 guarded technical fixtures and replaceable generated WebP illustrations.
- Local draft scaffold/reference report and measured browser/performance evidence.
- No database, API, email or persisted inquiry data.

The owner subsequently authorized execution. See qa/blog/FINAL.md for exact
verification and limitations. The design uses ui-ux-pro-max, free
from the current site's visual styling; keep unrelated pages unchanged. Temporary
AI-generated WebP article/taxonomy assets are approved for later replacement.

## Directory responsibilities

- `domain/`: pure models, publication/filtering/linking rules and inquiry text.
- `domain/__tests__/`: meaningful unit tests for those rules.
- `data/`: content reading/validation/mapping and public tour-data access.
- `presentation/components/`: cards, article UI, inquiry/review UI.
- `presentation/pages/`: page composition used by thin Astro routes.
- `presentation/markdown/`: processor-specific AST/rendering transforms.
- `presentation/scripts/`: scoped browser interactions only.
- `presentation/styles/`: scoped blog tokens/styles for the new design direction.

Thin routes live under src/pages/[locale]/blog; authoring/check tools live under
scripts/blog. Build guards run after the shared sitemap generator.

## Review and next editorial step

Local guarded preview: http://127.0.0.1:4327/it/blog/ (English also available).
Use AUTHORING.md to prepare approved articles and add a real author to
data/authors.ts before publication. Fixture articles cannot enter a production
artifact. Replace the temporary artwork using ASSETS.md. No hosting or deployment
was changed. The inquiry stays a WhatsApp handoff, with no Supabase backend.
