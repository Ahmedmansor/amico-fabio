# Blog phase 4 — technical fixtures and enforced artifact guards

Date: 2026-10-28.

22 labeled artificial articles cover both languages, translated/untranslated
slugs, >9 published posts per language, long/short content, city/interest lists,
no-image/one-image/multiple-image cases, a hidden draft and a future article.
Each has a colocated deterministic 1200×800 WebP placeholder. These contain no
asserted travel facts. Generated editorial/category scenes are deferred to the
visual phase; see ASSETS.md for replacement status.

Focused results:

```text
node --test src/features/blog/data/__tests__/guard.test.mjs
tests 4 / pass 4 / fail 0. Exit code: 0.

npm run check:content
Synced content; generated types. Exit code: 0.

npm run check:blog
No diagnostics. Exit code: 0.

npm run check:fixtures
PASS: 156 generated text files are free from blog fixture content.
Exit code: 0.
```

One whole-site integration build covered the collection + artifact-guard
milestone. Used the documented process-only PUBLIC_AUTH_PASSWORD_ENABLED=0
override, BLOG_INCLUDE_FIXTURES=0 and empty PUBLIC_NOINDEX, without editing env
files or hosting settings. Existing catalog read required permitted network:

```text
Verified canonical and reciprocal hreflang for 90 indexable pages.
[fabio-blog-guard] Checked 156 generated text files; fixture artifact policy verified.
99 page(s) built in 8.93s
Complete! Exit code: 0.
```

Real negative command: process-only BLOG_INCLUDE_FIXTURES=1 and empty
PUBLIC_NOINDEX, then npm run check:content. It failed as required:

```text
[blog] Fixture opt-in requires local dev or an approved noindex preview; production refuses it.
PASS: real Astro content sync rejects forced production fixture inclusion.
```

The guard is a build integration running after SEO output generation, not an
optional post-build suggestion. Tests cover marker leaks in HTML/JSON/XML/JS,
route references without visible markers, missing preview noindex and fixture
sitemap leaks. No public blog routes exist at this checkpoint; later route
integration must recheck that actual fixture pages are filtered/noindex.
