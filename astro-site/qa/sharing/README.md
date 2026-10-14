# Tour and package social metadata

Every published tour/package language route now provides its own poster in
Open Graph and Twitter metadata. The shared head accepts an optional image;
other pages retain the existing logo fallback and their favicon is unchanged.
Astro converts each original poster to a JPEG at up to 1200px wide, preserving
its aspect ratio and content. No crops, overlays, invented assets or visible UI
changes are introduced. Absolute HTTPS URLs, dimensions, type and localized alt
are included; language equivalents intentionally share their original poster.

Titles retain the existing `Fabio Tours | <localized title>` format. Descriptions
use the entire existing localized short description with normalized whitespace,
instead of truncating at an arbitrary 200-character boundary. Existing bilingual
`seo_tags` are carried into meta keywords as in legacy, without adding copy.
Meta keywords are not claimed as a Google ranking factor; a future editorial
SEO pass may propose changes for user review. No content, prices or claims are
rewritten by this task.

```sh
npx astro check
npm run build
node scripts/verify-sharing.mjs
```

The verifier checks all 72 pages against catalog content, validates generated
JPEG files, confirms their original poster fingerprint matches the page's hero,
and writes `metadata.json`. It checks single metadata values, localized titles,
descriptions and alt, per-language URLs and the shared poster for equivalents.
This checks generated HTML/files, not a live Facebook or WhatsApp preview.
Those platforms cannot fetch localhost. After an authorized deployment, verify
the public URLs and refresh platform caches as needed. No external share,
publication, new dependency or redesign was performed.
