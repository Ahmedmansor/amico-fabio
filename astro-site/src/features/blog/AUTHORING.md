# Blog authoring guide

The collection, validator and local authoring commands are implemented. Run the
commands below from astro-site/ with the pinned external Node runtime. Real
publication still requires approved copy, author identity and image rights.

## Article location

```text
src/content/blog/it/{italian-slug}/
  index.md
  hero.jpg
  detail.jpg

src/content/blog/en/{english-slug}/
  index.md
  hero.jpg
  detail.jpg
```

Use lowercase ASCII letters, digits and hyphens for directory slugs. Reserved
slugs: `page`, `destinations`, `interests`. The directory language must match
frontmatter. A translated article can use a different slug but shares the same
translationKey. Each version has a distinct immutable ID.

## Draft template

This is fenced documentation, not a content entry. Replace every angle-bracket
placeholder before validation. Keep a new article draft until all required
content/assets and editorial approvals exist.

```md
---
id: "<immutable-version-id>"
title: "<approved title: 10–110 characters>"
description: "<approved description: 50–160 characters>"
pubDate: <YYYY-MM-DD>
lang: it
translationKey: "<shared-translation-key>"
destination: cairo
interests: [history, tips]
heroImage: ./hero.jpg
heroAlt: "<accurate descriptive alternative text>"
linkKeywords: []
featured: false
relatedTripIds: []
draft: true
---

<Approved introduction. The page layout supplies H1; begin sections with H2.>

## <First section heading>

<Approved article text.>

![<Accurate alternative text>](./detail.jpg "<Optional approved caption>")

## <Second section heading>

<Approved article text and any sources relevant to factual claims.>
```

Remove optional destination/translationKey when not applicable. `authorId` is
required for every real publication and must resolve to data/authors.ts; that
registry is currently empty, with no default. Drafts may omit it while preparing.
Optional updatedDate must not precede pubDate. Add optional heroCaption
only when supplied. Do not make the title/description generic placeholder text in
a real publication. `fixture: true` is reserved for technical tests.

## Metadata rules

| Field | Author action |
| --- | --- |
| id | Keep stable after creation, even if the slug/title changes |
| lang | Use the article directory's language: it or en |
| translationKey | Same key only for actual equivalents; unique per language |
| destination | Optional: cairo, luxor, aswan or sharm |
| interests | One or two distinct values: history, diving, desert, food, tips, stories |
| linkKeywords | Own-language phrases of at least four characters, claiming this article as link target |
| heroImage | Relative path to a real local image beside the article |
| heroAlt | Descriptive, at least five characters; no fabricated image description |
| relatedTripIds | Existing published stable catalog trip IDs; use blog:references, not guessed slugs |
| draft | true while preparing content; false only for intended publication |

Keywords may appear in any article's prose. Only ownership of an automatic-link
phrase is exclusive within a language. Matching ignores case/extra whitespace,
retains accents, and prefers longer overlapping phrases. A conflict must report
both article files. Never rename an old claim blindly to silence the checker;
choose the correct intended destination.

## Links and images

- Temporary AI-generated visuals may be used for guarded fixture articles and
  city/interest cards. Store WebP assets at stable semantic source paths and
  record them in the asset inventory for the owner's later replacement.
- Replacing a source file requires a rebuild. Recheck alt/caption, crop and
  rights; do not describe generated scenes as verified real photographs.
- Use ordinary Markdown for body images so the Astro image pipeline can process
  local assets. Caption is the optional Markdown image title.
- Every informative body image needs meaningful nonempty alt text.
- Manual internal links include the current language and trailing slash, e.g.
  `/it/blog/{existing-slug}/`. Use real destinations only.
- Do not manually link another-language site route in body content. The shared
  language switcher handles translations. External reference sources are allowed.
- Hero is rendered by the layout; do not repeat it as the first body image.
- The first body image triggers one inline inquiry CTA; no image falls back to
  before the second H2. Authors do not paste generated CTA HTML into Markdown.

## Editorial readiness for SEO and GEO

- Answer the article's actual question clearly and organize supporting details
  with descriptive headings, lists or tables where helpful.
- Verify facts and cite appropriate sources; distinguish experience/opinion
  from sourced factual claims. Do not invent offers, prices or guarantees.
- Use an approved author identity and accurate publication/update dates.
- Review title, description, captions and text in the published language.
- Ensure structured metadata will describe visible content accurately.
- Technical markup does not guarantee indexing, rankings or AI citations.

## Actual author workflow

1. Run `blog:new` with your supplied title, description, image, accurate alt and
   interest (example below), or copy the documented template manually.
2. Add approved body text and authorId; keep draft:true during preparation.
3. Run `blog:references` to validate content and list claimed phrases/files,
   approved author IDs and published trip IDs. Catalog access is read-only.
4. Preview the article and actual translations at mobile and desktop widths.
5. Test manual links, image descriptions and WhatsApp message review.
6. Set the intended date/draft state and run required tests/check/build/guards.
7. Review the generated artifact and commit explicit content files.

```powershell
npm run blog:new -- it articolo-slug --title "<your approved title>" --description "<your approved description, 50–160 characters>" --image "C:/path/approved-photo.jpg" --alt "<accurate image description>" --interest tips
npm run check:content
npm run blog:references
```

Replace the example values with your content. The command creates a unique
immutable ID, date and `draft: true`, and converts the supplied image into
colocated hero.webp. It refuses an existing article directory and invalid
locale/slug/metadata; it never invents an author or approved body. Other optional
fields are edited in index.md. If a write fails, inspect the reported directory
before retrying; an existing folder is never overwritten automatically.

Drafts are validated but omitted from routes. For a local content review, supply
an approved author and intended date before changing draft to false. Technical
fixtures are available only through the separate dev/noindex-preview policy;
do not mark real drafts as fixtures to bypass editorial approval.

`blog:references` refreshes the native validated snapshot first. Its keyword list
shows currently published claims for that command's policy; inactive/draft
claims do not reserve automatic-link phrases. Dev fixture claims can differ
from a production snapshot. Do not run sync concurrently with an active dev
server; stop/restart dev when switching publication policy.

After an implementation/content milestone, use `npm run check:links` on the
built artifact. Link and fixture guards also run automatically during builds.
Rebuilds are necessary for changed published content/assets, not every edit to
documentation. No hosting deployment is performed by these commands.
