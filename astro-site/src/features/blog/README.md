# Blog feature

Status: technical foundations, visual assets and listing UI implemented; article pages next.
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
| [AUTHORING.md](./AUTHORING.md) | Planned article format, template and editorial checklist |
| [QA.md](./QA.md) | Verification cases, browser checks and evidence requirements |

PLAN.md owns requirements. EXECUTION.md tracks work. QA.md defines evidence;
it never implies that an unchecked case has passed. Record future deviations in
DECISIONS.md and update affected requirements before reporting completion.

## Current deliverables

- Planning documents, pure domain helpers/tests and remaining layer placeholders.
- Registered collection/schema/loader, 22 guarded technical fixture articles,
  generated WebP illustrations and focused verification scripts; index/taxonomy
  routes are implemented, article routes are next.
- A pinned dev-only native Markdown adapter and isolated verification runner;
  no application collection/routes/environment/hosting changes.
- No database, API, email or persisted inquiry data.

The owner subsequently authorized execution. Runtime acceptance remains pending
until actual checks are recorded. Use ui-ux-pro-max for a new blog design, free
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

Content/config/routes/scripts outside the feature remain planned paths until
their implementation phase. Empty directories contain only `.gitkeep` files.

## First implementation task

Continue with phase 6's article routes/layout, then the scoped linking/SEO and
WhatsApp work. Listing browser evidence is in qa/blog/PHASE_5.md. The inquiry must
remain a WhatsApp handoff using shared public configuration; no Supabase work
belongs to this feature.
