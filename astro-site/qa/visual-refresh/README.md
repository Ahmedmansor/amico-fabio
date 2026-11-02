# Requested dark UI corrections and tourism imagery — 2026-11-02

The favorite control's global hover rule painted its full background orange.
On touch devices a tap could retain that hover, while the selected-heart color
was also orange. Hover is now restricted to fine pointers with real hover, uses
a subtle themed surface, and native tap highlighting is suppressed on the
favorite button. Keyboard focus remains visible. The selected heart stays gold
against the dark button surface. Favorite persistence and business logic are
unchanged. Facebook icons in home reviews now use the theme-aware heading color,
keeping their existing blue in Light and a legible light foreground in Dark.

## Six generated assets

The owner clarified the three rotating images are in the **homepage hero**, not
the separate commandments guide. Artwork was generated with the built-in
imagegen tool and visually reviewed. These are illustrative AI-created tourism
campaign images, not photographs documenting actual guests or booked facilities.
Package subjects follow the existing source copy; no prices, words or logos are
baked into the artwork, so existing translations remain usable.

| Asset | WebP dimensions | File size |
| --- | --- | --- |
| Dolce Vita family yacht cover | 1200 × 800 | 96.5 KiB |
| Indiana Jones Sinai quad cover | 1200 × 800 | 149.6 KiB |
| One Thousand and One Nights sunset sailing dinner | 1200 × 800 | 100.8 KiB |
| Homepage Red Sea | 1440 × 960 | 265.2 KiB |
| Homepage Giza pyramids | 1440 × 960 | 215.6 KiB |
| Homepage Sinai | 1440 × 960 | 260.8 KiB |

Sharp encodes WebP at quality 78/effort 6, strips default PNG metadata and resizes
without enlargement. `assets.json` records exact bytes, previous file sizes,
dimensions and SHA-256. The originals remain in the local imagegen output folder;
selected WebP outputs are committed in the existing Astro asset locations.
Old assets remain available in Git history and legacy source is untouched.
New source files are larger than the old small placeholders; no claim is made
that they are smaller than the previous imagery. Existing Astro responsive
optimization remains in use, including AVIF negotiation with WebP alternatives.
All six are already linked through existing imports/catalog mappings.

## Actual focused verification

```text
npx astro check: Result (629 files): 0 errors, 0 warnings, 0 hints.
Noindex demo-preserving build: 285 page(s) built in 25.93s; Complete!
Visual refresh: 6 focused browser cases passed.
git diff --check: no whitespace errors.
```

The browser check emulates mobile touch (375px, coarse pointer). Saving a trip
kept the surface rgb(25,25,25), with visible gold heart rgb(245,163,27). The review
Facebook icon uses rgb(242,242,242) in Dark. All three hero images decoded and
each changed package poster loaded. Homepage mobile/1280px desktop crops and
all package covers were captured locally. Page-error list was empty.
This is focused appearance/media QA, not a new test of account synchronization
or removal persistence. An initial extra immediate second-tap removal assertion
was dropped from this appearance-only runner; no pass is claimed for it.
Screenshots are ignored; `results.json` and scripts are committed.

Checks retain existing guarded demo posts/guides with process-local
BLOG_INCLUDE_FIXTURES=1, PUBLIC_NOINDEX=1 and a localhost PUBLIC_SITE_URL.
No dependency, Supabase data, price, analytics configuration, hosting setting,
production domain or legacy source was changed.

The owner's Network screenshot shows successful 200/204 requests initiated by
the Google measurement script. These are measurement-related, not catalog data
requests; the screenshot alone cannot prove event duplication or exact payloads.
The existing shared consent integration loads the Google script only after
analytics opt-in. No analytics event was sent as a test for this task.
