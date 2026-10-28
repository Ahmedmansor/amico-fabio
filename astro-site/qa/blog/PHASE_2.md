# Blog phase 2 — pure domain foundation

Date: 2026-10-28. Scope: models, controlled taxonomy, publication/filtering,
featured selection, active taxonomy counts, translation routes, related scoring
and reading time. Inquiry input types are prepared; WhatsApp UI/message behavior
is still phase 10 work.

```text
node node_modules/vitest/vitest.mjs run src/features/blog/domain/__tests__/blog.test.ts
Test Files  1 passed (1)
Tests       16 passed (16)
Exit code: 0
```

Coverage includes captured UTC publication boundaries, hidden/foreign fixtures,
stable ordering, empty taxonomies, actual translated slugs, missing equivalents,
ambiguous translations, nonempty-city scoring, hidden/self/foreign exclusions,
limits, Unicode/Italian elisions and Markdown reading text.

Domain takes ordinary models and explicit time/policy arguments. Its only
cross-feature import is shared pure language configuration/types; no Astro,
provider, file, network, environment, storage or DOM access is present.

No full-site build or unrelated feature suite was repeated, following the latest
owner instruction. Collection/schema, routes, SEO integration and UI remain
pending; these tests do not claim those parts work.
