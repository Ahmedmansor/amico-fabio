# Phase 7 — automatic links and output guard

2026-10-28, migration branch; tested working files based on f1aa05c.

The native Markdown processor now links eligible text using pure domain matching.
It preserves original text, handles Unicode boundaries/normalization, prefers
longer overlapping claims, caps automatic links at five and excludes self,
hidden/future/foreign targets and targets already manually linked anywhere.
Headings, code, captions, links, buttons and data-no-autolink regions are excluded.
Native processor tests inspect the rendered HTML, including raw HTML exclusions.

Real output from astro-site/:

```
node node_modules/vitest/vitest.mjs run src/features/blog/domain/__tests__/internal-links.test.ts src/features/blog/presentation/markdown/__tests__/processor.test.ts
Test Files 2 passed (2)
Tests 17 passed (17)
npm run check:blog
tsc --noEmit --project scripts/blog/tsconfig.json
exit 0
node --test scripts/blog/check-links.test.mjs
tests 6; pass 6; fail 0
```

The build hook now checks blog paths/fragments, cross-language body links,
canonical/H1/html language, image alt and reciprocal alternates. Other pages are
only parsed as destinations; campaign and bilingual-404 semantics are preserved.
Positive artifact and intentional missing-target/fragment/language/alt/alternate
failures were verified. Full generated-site invocation is batched with the next
integration build, not claimed here.

`satteri` 0.10.5 is directly declared for its existing native HTML AST parser and
typed plugin API; already present transitively, no second Markdown engine added.
