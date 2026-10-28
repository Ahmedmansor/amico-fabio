# Blog phase 3 — collection and validated data

Date: 2026-10-28. Collection registered; no article routes or published content.

## Focused verification

```text
node node_modules/vitest/vitest.mjs run src/features/blog/domain/__tests__/blog.test.ts src/features/blog/data/__tests__/content.test.ts
Test Files  2 passed (2)
Tests       35 passed (35)
Exit code: 0

node scripts/blog/verify-content.mjs
PASS: valid colocated article passes real Astro schema/loader sync
PASS: unknown interest is rejected with record/field context
PASS: missing heroAlt is rejected with record/field context
PASS: normalized duplicate keyword reports both actual article files
Exit code: 0

npm run check:content
astro sync: Synced content; Generated types. Exit code: 0.

node node_modules/typescript/bin/tsc --noEmit --project qa/blog/.pipeline/tsconfig.json
No diagnostics; exit code: 0.
```

The temporary typecheck config selected only blog TypeScript, content.config.ts
and generated Astro declarations. The same scope is now maintained in
scripts/blog/tsconfig.json via `npm run check:blog` for future verification.

Real sync rejection tests run in disposable separate Astro CLI processes, so
background cache writes after expected schema failures cannot race directory
cleanup. CLI location is obtained from the installed package's bin declaration.
No full-site build, external catalog read or unrelated feature tests were run.

## Implementation

- Astro's glob/parser/schema is the content source; no parallel frontmatter parser.
- Full metadata pass precedes index validation and rendered-store updates.
- Source-aware errors cover fields, IDs, slug namespaces, translations, keyword
  claims and references. Cross-record validation is deterministic by source path.
- Original language folders, immutable IDs and translated slugs stay distinct.
- Real publication requires an approved author ID. The author registry is empty
  until the owner supplies identity; draft/fixture content can be prepared.
- Tour references use getTrips() only when any article declares relatedTripIds.
- The ignored snapshot captures one publication policy for route/data consumers.
- Build-time filesystem APIs use @types/node 24.10.1 as a pinned dev dependency.
- Publication flags have unit coverage; enforced artifact guards and real
  fixture content remain phase 4 work. No production fixture safety is claimed
  complete at this checkpoint.

Remaining: output guards, fixture matrix, full production Markdown transforms,
pages, scoped design, SEO integration and WhatsApp UI.
