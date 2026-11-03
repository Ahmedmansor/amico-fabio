# Fabio offers preference card — 2026-10-29

The request was interpreted as the account/wishlist offers preference, implemented by `MarketingConsent.astro`. The existing first-registration welcome dialog is a separate favorites-reminder consent and has not been relabeled as offers. The current normal build does not render the marketing card because its existing activation gate is off. This task changes the design, not that gate or promotional sending.

## Change

- Extracted the existing markup into `MarketingConsentCard.astro`, preserving every controller selector, the hidden initial state, disabled initial controls, native unchecked checkbox, explicit save, live status and retry. The existing Auth/config wrapper and marketing coordinator/repository remain unchanged.
- Added an original Fabio portrait in a soft framed shape with an envelope badge. It is the same existing transparent photo, moved without pixel changes from home-owned assets to `shared/assets/people/fabio.webp`; the home imports the shared asset. `FabioPortrait.astro` owns the reusable presentation and optimized local image.
- Matching IT/EN copy asks about offers from Fabio for saved trips. The purpose remains offers/discounts related to favorites; existing withdrawal/account-use and separate-reminder explanation remains. No new frequency, offer availability, sender integration, verified grant or delivery is asserted.
- Uses only existing theme tokens, rounded surfaces, a large label target, native keyboard interaction, clear disabled states and a privacy link. No animation, dependency or added runtime script for the live card.

## 21st

Applied the installed `21st-ui-build` skill with the project's `.21st/` constraints. CLI search for `newsletter signup profile card` still returned `Not signed in`. Public reference: [Newsletter Signup Card](https://contact_2a72bbaa.21st.dev/@f0rextasy/components/newsletter-signup-ticket), which lists MIT and links to [public source](https://raw.githubusercontent.com/F0Rextasy/bigbullui/main/src/components/blocks/block-newsletter.tsx). That public source was successfully read via GET, without uploading project files. Its card composition informed the layout; no React/source component was installed or copied. Its local-only confirmation behavior was not adopted: real consent still relies on the existing confirmed server result. No hosted generation or cloud source review ran.

## Verification

- `npx astro check`: Result (576 files), 0 errors, 0 warnings, 0 hints.
- `npm run build`: 171 pages built, Complete. No QA route in `dist/`.
- Isolated design preview build: 173 pages in ignored `.astro/marketing-card-ui`; its temporary route is removed in `finally`. Normal flags and output remain unchanged. The QA server supports an optional `QA_ROOT` while keeping `dist` as its unchanged default.
- Four Chromium cases: IT/EN at 375/1280. Original portrait loads, unchecked default, keyboard Space, disabled loading/unverified/error states, retry and no horizontal overflow/page errors. Zero remote requests. Preview Save explicitly says no preference was saved. These are UI-state checks, not account/consent integration or inbox tests.
- Lighthouse accessibility on the isolated styled preview: 100; zero failing audits. See `lighthouse-summary.json`.
- Desktop and mobile screenshots manually inspected; screenshots/raw Lighthouse data ignored. Existing home uses the identical shared image bytes; static build resolves its updated import.
- No database/provider/hosting/feature-flag changes, no account creation, no consent writes and no emails sent. Marketing activation remains outside this UI change. No broad Auth/reminder/backend test suite was run.

## Review locally

Run `node qa/marketing-design/build-preview.mjs`, then set `QA_ROOT=.astro/marketing-card-ui` and `QA_PORT=4338` before starting `node qa/header/static-preview.mjs`.

Preview: http://127.0.0.1:4338/en/qa-marketing-card/ and http://127.0.0.1:4338/it/qa-marketing-card/ . The page is explicitly marked design-only; its external state controls are QA-only and do not ship in the actual card.
