# Fabio Egypt channel banner — 2026-11-03

Owner requested the supplied two-phone WhatsApp channel design above every site
footer, using Fabio Egypt branding and the existing site theme. The channel does
not yet exist; only the design is implemented. Not deployed to production.

Implemented as whatsapp-channel/data, pure domain with tests and presentation.
Shared Footer renders it once for main-site/editorial/account pages. Both Italian
campaigns render it immediately before their distinct existing footers. Scoped
styles do not import the main site shell into campaigns. The approved navy/gold
theme, local Montserrat/Playfair, real Fabio logo and existing catalog image are
reused. Decorative phone previews are aria-hidden/inert; the actual heading,
copy and disabled status button remain accessible. Small hover movement respects
reduced motion. No browser JavaScript or new dependency is required.

All eight new text keys are provided in IT/EN/ES/PT/DE dictionaries. Source
prototype's unrelated brand, verification badge, reviews/certification claims,
customizer, fake join toast, CDN Tailwind and Google Fonts were not imported.
No form, opt-in, reminder, Auth or analytics behavior changes.

## Activating the eventual channel

Set only `siteConfig.whatsapp.channelUrl` in `src/shared/config/site.ts` to the
real `https://whatsapp.com/channel/...` URL, rebuild and publish. The current
empty string is intentional. The pure domain validator accepts only actual
WhatsApp channel URL shapes; no ordinary chat, foreign host, credentials or
tracking/redirect parameters. Missing URL displays localized coming-soon copy
and a native disabled button with no placeholder href. Once configured, it
renders the follow link with noopener/noreferrer. No real follow was tested.

## Real verification

```text
npx astro check
Result (729 files): 0 errors, 0 warnings, 0 hints

npm run build
230 indexable canonical/reciprocal pages verified
572 page(s) built in 14.80s; Complete!

npx vitest run src/features/whatsapp-channel/domain/__tests__/channel.test.ts
1 file passed; 2 tests passed

node qa/footer/verify-channel.mjs
WhatsApp channel verified on 240 footer pages: once before footer,
Fabio Egypt branding, disabled coming-soon action, no placeholder href or
borrowed brand claims; both campaigns included.
```

The coverage check initially picked testimonial-card footers in the page body;
its selector was corrected to the actual site/campaign footer, then passed.
No failing run is represented as successful.

Desktop screenshot review confirmed navy/gold composition, readable content,
real branding and two tilted phones. A 375x900 browser review confirmed the
stacked composition; viewport includes the browser scrollbar (document width
360px), no horizontal overflow. EN/ES/PT/DE home pages plus welcome/offerta-sharm
each showed one banner before the footer, translated heading and disabled
button. Italian mobile was also visually inspected. Welcome banner width is
328px within its existing padded shell; other tested pages are 360px. Viewport
override was reset after testing. No real contact or Auth request was submitted.

Design context: read .21st/DESIGN.md, design.json, theme.css and UI/UX skill
guidance. Contextual 21st search could not run because the npm registry lookup
failed with ENOTFOUND in the restricted runtime. The UI/UX search launcher also
reported no installed Python; used its documented general accessibility/
responsive rules as fallback, not a claimed search result. Owner-provided
reference and actual project primitives ground this implementation. No cloud
source-review upload was retried after the earlier documented rejection.

QA coverage JSON and script are committed; generated dist and caches remain
ignored. Existing localized route work on this branch is preserved.
