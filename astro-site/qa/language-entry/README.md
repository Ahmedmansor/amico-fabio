# Root homepage, language suggestion and Fabio favicon — 2026-11-04

Implemented on `codex/root-language-and-favicon`. Main and the published
`gh-pages` artifact are unchanged by this implementation checkpoint.

## Approved behavior

- `/` renders the existing Italian HomePage component directly, with the same
  data access, sections, content, styles and shell as `/it/`. No redirect,
  loading screen, hidden page or automatic language navigation.
- On the root only, the first supported browser language may produce a small
  nonmodal suggestion written in that language. Italian/unsupported preferences
  produce no suggestion. The visitor can accept or remain in Italian.
- Explicit choices reuse existing `fabio_lang` / `preferredLanguage` keys.
  Choosing Italian suppresses repeat suggestions. A saved non-Italian choice
  produces only a return-language link, without repeating the question.
- Header language choices update the same preference. Merely following a URL
  does not overwrite that preference. Denied storage cannot block native links.
- No language detection changes account preferences or grants consent. The
  default root page does not automatically synchronize Italian into a signed-in
  account; actual localized routes retain their existing locale synchronization.
- Suggestions wait while consent or native dialogs are open and do not move
  focus. Without JavaScript the complete Italian homepage and language links work.
- Root canonical/hreflang match `/it/`. The SEO build guard explicitly verifies
  that equivalence and excludes the root alias from the sitemap, keeping 232
  entries. It still rejects other wrong canonicals and missing language targets.
- Shared tab and touch icons now use transparent PNG derivatives of the existing
  `src/shared/assets/people/fabio.webp`, at 96px and 180px. Social share images
  are unchanged. No generated portrait, dependency or image source replacement.

## Actual checks

```text
Node language-entry domain + shared SEO + dictionary checks:
24 tests, 24 pass, 0 fail

Node Auth locale repository/coordinator regression tests:
22 tests, 22 pass, 0 fail

npx astro check
Result (777 files): 0 errors, 0 warnings, 0 hints

npm run build (reviewed production public flags)
575 page(s) built in 24.62s; Complete!
232 canonical/reciprocal pages; fixture artifact policy verified

node scripts/verify-production.mjs
Production artifact verified: 232 indexable sitemap URLs;
5 login/wishlist languages; 655 text artifacts; correct domain,
active Auth, no fixtures or private credentials.

node qa/language-entry/browser.mjs
Language entry QA: 9 scenarios passed; screenshots local;
no external submissions.

git diff --check
Passed (only existing Git line-ending conversion notices).
```

Browser checks include first visit/acceptance/new-tab return/direct links at
390px and 1440px, persistent dismissal/header override, Italian and unsupported
browser languages, ordered regional fallback, denied storage, no JavaScript,
byte-identical homepage section HTML, transparent square favicon and sitemap.
Root and Italian screenshots at matching widths remain ignored locally under
`screenshots/`; reviewed the mobile root capture. `results.json` is tracked.
Run with external `PLAYWRIGHT_MODULE` and optional `QA_BROWSER`; the script
serves dist on an ephemeral local port and blocks all external requests.

The initial sandbox Astro check could not reach the catalog; the authorized
network-enabled check/build above succeeded. Initial browser QA exposed two
test-harness assumptions (Windows trailing separator; nonexistent main wrapper).
Both were corrected to the actual unchanged homepage before the final pass.
The 21st CLI reference lookup was unavailable (registry resolution failed, then
automatic approval review could not complete due to usage limit). No remote
source review is claimed. Existing site primitives/tokens were used; UI UX
guidance supplied keyboard focus recommendations. No redesign was performed.

No real login, account mutation, booking, email or external submission was
performed. Auth account-language behavior remains a source-level guard with
existing coordinator/repository regression coverage, not a new signed-in live
integration claim. Rollback: revert this focused source commit and rebuild.
