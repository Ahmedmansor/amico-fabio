# Blog feature

Status: documentation and empty directory scaffolding only. Updated 2026-10-28.

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

- Planning documents and empty layer/subdirectory placeholders.
- No collection registration, Markdown entries, generated routes or scripts.
- No package/configuration/environment/hosting changes.
- No database, API, email or persisted inquiry data.

The owner requested preparation only. Do not start phase 1 until a subsequent
implementation instruction. No build/runtime acceptance is claimed here.

## Directory responsibilities

- `domain/`: pure models, publication/filtering/linking rules and inquiry text.
- `domain/__tests__/`: meaningful unit tests for those rules.
- `data/`: content reading/validation/mapping and public tour-data access.
- `presentation/components/`: cards, article UI, inquiry/review UI.
- `presentation/pages/`: page composition used by thin Astro routes.
- `presentation/markdown/`: processor-specific AST/rendering transforms.
- `presentation/scripts/`: scoped browser interactions only.
- `presentation/styles/`: blog styles using the existing site theme.

Content/config/routes/scripts outside the feature remain planned paths until
their implementation phase. Empty directories contain only `.gitkeep` files.

## First implementation task

Follow EXECUTION.md phase 1: prove the installed Astro 7 Markdown/image pipeline
in isolation before building the full collection or pages. The inquiry must
remain a WhatsApp handoff using shared public configuration; no Supabase work
belongs to this feature.
