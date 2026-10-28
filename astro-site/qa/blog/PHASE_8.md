# Phase 8 — navigation and article metadata

2026-10-28, working revision based on 42ce7bf. The existing alternate-map and
sitemap prerequisite is documented in SEO_PREREQUISITE.md. Article heads now
contain visible-content BlogPosting/BreadcrumbList JSON-LD, actual author type,
UTC dates and optimized social image. Fixture author is explicitly a demo
organization, never a fabricated real person. Updated date is omitted unless
supplied. JSON serialization escapes closing-script sequences.

Pagination has page-specific titles and prev/next links. The existing shared
header's Blog entry now points to the correct-language real route; its language
anchors have an explicit switcher marker. No header styling changed.

Focused real output (astro-site/):

```
vitest run src/features/blog/presentation/markdown/__tests__/seo.test.ts
Test Files 1 passed (1); Tests 3 passed (3)
npm run check:blog
tsc --noEmit --project scripts/blog/tsconfig.json
exit 0
```

Implementation guidance rechecked against Google Search Central's Article and
Breadcrumb documentation on 2026-10-28. Integration artifact, shared-header
browser regression and structured-data validation remain in the final grouped
checkpoint; these unit results do not claim rich-result eligibility or indexing.

https://developers.google.com/search/docs/appearance/structured-data/article
https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
