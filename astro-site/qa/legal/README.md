# Legal page migration verification

The migrated routes are `/it/legal/` and `/en/legal/`. No other production page
was migrated in this task. All 12 legal sections, their headings, paragraphs,
bullet lists, data-type chips, IDs, and index labels were extracted from the
existing Italian and English dictionaries.

## Browser comparison

Compared the local legacy `legal.html` against the Astro route in each language:

| Language | Width × height | Sections and text | Index | Footer and contacts | Image labels |
| --- | --- | --- | --- | --- | --- |
| Italian | 1440 × 900 | Match | Match | Match | Match |
| English | 1440 × 900 | Match | Match | Match | Match |
| Italian | 390 × 844 | Match | Match | Match | Match |
| English | 390 × 844 | Match | Match | Match | Match |

The actual DOM comparison results are in `browser-comparison.json`. Full-page
screenshots of each legacy/Astro pair were saved to the local screenshots
directory recorded there. Minor spacing differences remain; no legal section,
paragraph, image, contact destination, or index item is missing. The legal page
has no prices to compare.

Checked both language-switch directions, mobile navigation, the 12 floating
index links, index dismissal after navigation, and hiding floating controls
when the footer appears. All page images, including lazy footer logos, were
confirmed loaded after reaching the footer.

## Deliberate migration behavior

- Content is rendered in static HTML rather than populated by `main.js`.
- All three indexes keep the same section targets. The mobile floating index
  keeps the original appearance. Without JavaScript, a static top index is shown.
- The same legal content is served from separate language URLs, with reciprocal
  hreflang and self-referencing canonical URLs.
- Navigation to the home page, reviews, trip grid, and Sharm guide temporarily
  points to their existing published URLs until those pages are migrated.
- The legacy Blog placeholder (`#`) is retained; no blog page was invented.
- Existing shared literal labels such as `Links` and `Close index` are retained
  in both dictionaries; new translations were not invented.
- The `motion_data` section retains the original fallback `intro.svg` icon.
- Flag artwork comes from the legacy SVGs, now in separate files to avoid
  duplicated inline clip-path IDs. No flag artwork was redesigned.
- Logos use Astro image optimization; original source logos are unchanged.
- Local fonts and icon files are copied byte-for-byte. CSS was extracted with
  its original ordering and values, and font paths were made explicit.
- No legacy service-worker unregistration, cache-clearing controller, or global
  browser translation application was copied. Legal content needs no network data.
- Existing GA4 page tracking is retained through a shared component. There is
  no lead form on the legal page; `generate_lead` remains part of the later form
  migration task. Actual delivery of analytics to Google was not verified.
- The description uses the existing introduction paragraph in each language;
  no new marketing or legal copy was written. The title uses the existing
  language-specific page heading.

## Reproduce checks

From `astro-site/`:

```sh
node --test src/features/legal/domain/__tests__/legal.test.mjs src/shared/i18n/__tests__/configuration.test.mjs
npx astro check
npm run build
node scripts/verify-legal-migration.mjs
```

The source/static verification compares the extracted dictionaries against the
legacy source, checks all paragraphs in HTML after scripts are removed, checks
SEO and analytics markup, and compares local font/icon/logo files with the originals.
This verifies static content availability without executing browser scripts;
a browser session with JavaScript disabled was not separately run.

The extraction script `scripts/extract-legal-source.mjs` is a one-time migration
tool using the existing legacy PostCSS installation. It is not a runtime or
build dependency and should not be rerun after intentionally editing migrated
content. No new library was installed for this task.
