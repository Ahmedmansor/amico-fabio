# Phase 11 — local authoring commands

2026-10-28. `blog:new` validates supplied metadata, creates a unique immutable
ID and unpublished draft, and converts an approved supplied image to colocated
WebP. It refuses an existing directory. It adds no invented body, author or travel
fact. `blog:references` refreshes the native content index and reports active
keyword owners/file paths, author IDs and read-only published tour IDs.

Real focused output (astro-site/):

```
node --test scripts/blog/new-post.test.mjs
creates a colocated unpublished draft and refuses overwriting; invalid inputs create no folder
tests 1; pass 1; fail 0
```

The scenario covers creation/decoded WebP, date/unique ID, unchanged existing
content, bad locale, traversal/reserved slug, bad interest, missing alt/image and
invalid title/description. Initial native Node import resolution and Windows
Sharp file-handle issues were corrected before this passing run. No sample
article was left in the source collection. AUTHORING.md contains actual syntax
and publication requirements. Reference report integration is batched with the
next content/build checkpoint rather than triggering another standalone sync.
