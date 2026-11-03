# Blog phase 5 — visual assets and listing pages

2026-10-28. New blog layout follows DESIGN.md/ui-ux-pro-max consultation and the
owner's shared palette. Uses local fonts, a scoped visual shell, featured image,
active interest/city cards, latest grid, nine-item pagination and empty states.
Seven generated illustrative assets were converted to WebP; see ASSETS.md.

Focused evidence:

```text
node node_modules/vitest/vitest.mjs run src/features/blog/domain/__tests__/blog.test.ts
Test Files 1 passed; Tests 20 passed. Exit code: 0.

npx astro check --tsconfig scripts/blog/tsconfig.json
Result (24 files): 0 errors, 0 warnings, 0 hints. Exit code: 0.

node scripts/blog/capture-listings.mjs <host-playwright-module> <installed-chrome>
PASS: 12 listing captures; one H1, no overflow/broken images/browser errors.
Exit code: 0.

node scripts/blog/verify-pipeline.mjs
All six PASS messages recorded in phase 1 passed again, including live target
keyword/draft changes. Added regression assertion: an article without body
images must retain its imported hero metadata. Exit code: 0.
```

The new scoped Astro check is limited to feature routes/components and necessary
imports. No whole-site build or unrelated feature suite was repeated. Source
changed since that typecheck: pagination wiring and pure alternate helper were
adjusted and browser output checked; later integration must validate final types.

LISTING_COMPARISON.json records IT/EN blog home, an Italian interest listing and
an English city listing at 375/768/1280px. Screenshots are local and Git-ignored.
Initial captures include the existing cookie notice; it is not a new blog UI.
Visual inspection confirmed image-led layout, responsive columns and the shared
palette; no legacy blog exists for a before/after comparison.

Corrected integration findings:

- Astro paginate requires a page-named route parameter and the enclosing locale;
  the catchall maps its generated pages to the approved listing URL structure.
- Metadata-first rendering must preserve schema assetImports as well as body
  image imports, especially when the article has no body images. A new assertion
  covers that previously unexercised case.
- Unpublished collection entries are removed after validating the complete index,
  so their schema assets cannot be imported accidentally by presentation access.

Article links intentionally target phase 6's next routes, which are not present
at this phase checkpoint. Full broken-link acceptance is not claimed. The CTA
currently offers a genuine generic WhatsApp link; the inquiry/review form arrives
in phase 10. No request-received/sent or email/database behavior is shown.
