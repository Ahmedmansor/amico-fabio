# Site theme, cards and Auth UI — 2026-10-29

Local implementation on the migration branch only. No deployment, remote Auth
settings, database writes, email dispatch or lead submission was performed.

## Implemented

- `theme.css` is the only literal color palette in application CSS. Other active
  styles consume its colors or color-mix shades. Removed the old black/gold root
  palettes and unused/duplicated legacy shell styling. National flags, original
  photos/logos and standalone email templates are assets/content, not a second
  website theme. Email templates and legacy root source remain unchanged.
- Shared header/footer cover home, catalog/details/packages, editorial pages and
  account pages. Rectangular Italy/UK SVG flags; native language/menu disclosures.
  Campaign shells keep their layout and lead flow; only their palette references
  are aligned with the owner's subsequent single-theme instruction.
- New static tour/package cards: large linked image, existing editorial badges,
  accessible favorite button, complete description, one unchanged starting price
  and detail action. Kept dataset IDs, sorting/filtering and returning-to-catalog
  state, including navigation from the new image link. Removed retired discount
  styles and duplicate animation rules. No business/domain/pricing changes.
- Home keeps its existing content/images/reviews and active-only promo rule.
  Promo is in document flow; desktop hero is a split layout, mobile images scroll
  natively. AVIF + WebP hero sources and appropriate image sizes. Reviews are
  shown once in a native scroll row, with no endless duplicate animation.
  Biography uses a native dialog rather than device sensors/continuous animation.
  Trust labels reuse existing bilingual biography headings; the request CTA reuses
  the bilingual trip-planner content. No invented EN campaign claims or duplicate
  lead form was introduced.
- Auth uses the same palette in a light card, visible signin/signup controls,
  existing name/password/confirmation/OTP forms and a monochrome Google mark.
  Consent and backend logic are unchanged. Existing EN catalog heading was
  incorrectly Italian; replaced it with its existing English SEO wording.
- Public Turnstile local alias is explicitly mapped for builds; no secret loaded
  into client configuration. Port 4327 was serving passwordEnabled=false.
  Browser Auth also correctly rejects a mismatched configured site origin; the
  local QA build uses matching PUBLIC_AUTH_SITE_URL on port 4333. These guards
  were preserved, not bypassed. New forms were visually exercised without sending.

## Design references

Read UI/UX Pro and applied its verified keyboard/focus and Astro static-component
guidance. The project's approved palette supersedes generated palette suggestions.
Reviewed [21st cards](https://21st.dev/community/components/s/card) and
[navigation](https://21st.dev/community/components/s/navigation-menu) as visual
references; implemented small hover/active transitions in CSS for fine pointers,
with reduced-motion support. No registry component source, React, animation
runtime, new dependency or paid service was added.

## Actual verification

- `npx astro check`: Result (550 files), **0 errors / 0 warnings / 0 hints**.
- `npm run build`, with local noindex fixture flags: **171 pages built,
  Complete**. Catalog: 22 trips, 14 packages, 3 addons, 1 settings. Reviewed local
  environment values were passed to the build process; no env file was changed.
- Visual/browser results: `theme-review.json`, script `theme-review.mjs`.
  Covers IT/EN home/catalog/signin/signup at 375/768/1280, 320px flags/menu,
  articles, guide, a real package, wishlist, legal and both campaign shells.
  Checks include guest favorite/count, price sorting, package filtering,
  biography modal and Escape/focus behavior. No Auth or booking form submitted. The final full review has 33 cases; a focused
  Auth rerun (theme-review-auth.json) verifies the 320px CAPTCHA correction and
  updates only its affected rows. Turnstile selects its documented compact size
  when the form container is narrower than 300px; verification callbacks/reset
  remain unchanged. Reference: [Cloudflare widget sizes](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/).
- Original content/link comparison: `site-shell-before.json` /
  `site-shell-after.json`, script `site-shell.mjs`. Local ignored screenshots in
  `screenshots/site-shell-before`, `screenshots/site-shell-after` and
  `screenshots/theme`. Biography content must be included when comparing its
  original overlay with the new native dialog. Home heading levels, section
  order, the added planner CTA and removal of duplicate review copies are
  intentional presentation differences, not dropped original content.
- Lighthouse 13.6.0, headless Chromium, simulated mobile/desktop. Exact results
  and environments are recorded in `lighthouse-summary.json`. The original
  Python preview used uncompressed HTTP, so compressed QA measurements are
  reported separately. Both are laboratory measurements, not field INP or
  deployed-host evidence. Static QA compression does not change the deployment
  architecture or built files. No cache warmup or disabling Auth for the audit.
- A trial of `build.inlineStylesheets: 'always'` only changed mobile Performance
  from 77 to 78 and increased HTML; rejected it and retained shared external CSS.
  Lighthouse accessibility issues in heading order, rating roles and the brand
  link's accessible name were fixed; Accessibility reached 100 on home and catalog.

Final compressed local laboratory scores:

| Page/device | Performance | Accessibility |
| --- | --- | --- |
| Home/mobile | 91 | 100 |
| Catalog/mobile | 92 | 100 |
| Home/desktop | 99 | 100 |

Mobile LCP is **3.4–3.5s**, above the aspirational 2.5s target; field performance
and a deployed-host audit remain release checks. CLS is 0 in these final runs.

## Reproduce local review

Use the pinned external Node runtime. From `astro-site/`, set process-only
PUBLIC_NOINDEX=1, BLOG_INCLUDE_FIXTURES=1, PUBLIC_SITE_URL and PUBLIC_AUTH_SITE_URL
to `http://127.0.0.1:4333`, then run `npm run build`.
Run `node qa/header/static-preview.mjs`; it serves only `dist/` with gzip and
no-cache for reproducible local review. Browser scripts accept PLAYWRIGHT_MODULE
and QA_BROWSER paths from the existing external tooling. Raw Lighthouse JSON and
screenshots are ignored; compact reports/scripts are committed.

The current review address is `http://127.0.0.1:4333/en/login/` (also `/it/login/`,
`/it/`, `/it/explore/`). Actual Google/password/OTP delivery and cross-browser
account integration remain owner tests; this UI work does not claim inbox receipt.
