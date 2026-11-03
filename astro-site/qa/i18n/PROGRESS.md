# Spanish and European Portuguese — 2026-11-02

## Implementation completed locally

The four-language configuration is now active. The additional tour dictionaries
contain all 27 existing records per language; package dictionaries contain all
14 existing records per language. Added nine translated Egypt guide pages per
language, reusing the original images, stable place/product IDs, slugs and
publication/fixture markers. Existing IT/EN guides and catalog content are intact.

Home, explore city/category/price controls, tour/package details and included-trip
dialogs, booking/WhatsApp preparation, planner, login/callback, wishlist, legal,
cookie/privacy UI and 404 content use the new dictionaries. Country display labels
use native Intl with `pt-PT` for European Portuguese; stored nationality values
stay unchanged. Catalog-only add-on/banner/badge labels are translated in their
own data layers while retaining the actual provider source fields and prices.

Blog articles/listings remain IT/EN only. New-language navigation links to the
existing English journal with an explicitly marked language fallback. Blog
translation switching only advertises actual published equivalents. Campaigns
remain Italian-only. No UI framework, dependency or runtime server was added.

Account language constraints and existing backend functions were extended and
verified; see `../../supabase/site-languages/VERIFICATION.md`. Existing historical
email-language helper text was corrected in all four dictionaries to describe
the approved unified account language behavior without granting consent.

Actual final local results:

- `node scripts/i18n/check-translations.mjs`: 30 dictionaries passed key, array,
  type, placeholder, HTML, stable-ID/asset and numeric-value preservation checks.
- `npx astro check`: 610 files, 0 errors, 0 warnings, 0 hints.
- `npm run build`: 285 static pages, 282 canonical/reciprocal language checks,
  88 editorial link/metadata checks and 68 editorial JSON-LD checks. Test build
  remains noindex; sitemap has no indexable URLs.
- Focused Node checks: 43 passed (configuration, signed Auth mail, locale).
- Focused Vitest checks: 62 passed (email catalog/templates and booking totals).
- `qa/i18n/site.mjs`: 16 browser cases passed at 390/1440px, including new-language
  navigation, city filters, included-trip dialogs and booking invoice/WhatsApp
  preparation. WhatsApp was intercepted locally; no message was sent.
- Four further home-image cases verified lazy photos at their actual scroll
  positions before taking ignored screenshots. See `site.json`, `home-images.json`.

The browser harness initially encountered loopback permission separation, then a
late consent banner and existing explore query parameters. The local server/test
setup and assertions were corrected; the final results above are actual passing
runs. These were harness corrections, not claims that those failed runs passed.

## Published test deployment

Application commit `062cb09` is Ready on the existing `amico-fabio-test` project:
deployment `dpl_4oPXFN8nuMcszbDb7h7cYmwnQLcH`, 27-second build.
Vercel inspect confirmed the stable alias `https://amico-fabio-iyzo.vercel.app`.

Eight deployed Chromium cases passed for ES/PT home and package pages at
390/1440px, including loaded home images, language equivalents, included-trip
details and localized booking/WhatsApp preparation without sending. See
`deployed.json`. Additional public HTTP checks confirmed both Egypt-guide roots
and login pages return 200 with the correct language and noindex; excluded
ES/PT blog listings return 404. See `published-pages.json` and its runner.

Entry points: `/es/`, `/pt/`, `/es/egypt/`, `/pt/egypt/`, `/es/login/`, `/pt/login/`.
Final user check: sign in normally in either new language, switch language while
signed in and reload the wishlist; request an Auth email only if testing inbox
language. No real inbox delivery or authenticated multi-browser ES/PT test was
performed by the agent. User confirmed the existing test redirect wildcard.

No hosting variables, production/main, domain, campaign publication flags,
catalog records, business prices or booking rules were changed.

## Earlier dictionary-only checkpoint

User decisions: Spanish (`es`); European Portuguese (`pt`, `pt-PT` formatting).
Translate the main site and Egypt destination guides. Blog articles are excluded.
The independent `/welcome/` and `/offerta-sharm/` campaigns remain Italian only.

## Dictionary foundation

Added 26 ES/PT dictionaries across 13 groups: shared navigation, booking and
privacy UI, home including the existing review translations, explore filters,
legal content, Sharm Secrets, Auth, wishlist, marketing consent and reminder UI
and templates. Translation preserves the source's business claims; this is not
a new verification of those claims. Italian-speaking services/videos remain
described as Italian-speaking; no new service language is promised.

The extra dictionaries are deliberately not registered with the runtime yet.
There are no published ES/PT routes at this checkpoint. Tour/package dictionaries,
destination content, route/SEO wiring, country labels, catalog-only labels and
account/email language handling must be completed before activation.

Historical reminder/email-language copy in the source dictionaries still needs
to be reconciled with the latest account-language flow during that wiring task.
The translation files do not change consent, reminders, recipients or providers.

## Actual verification for this foundation

- `node scripts/i18n/check-translations.mjs --drafts`:
  `26 translated dictionaries: keys, array lengths, types, placeholders, HTML,
  stable IDs/assets and numbers preserved.` Four catalog dictionaries are
  explicitly reported pending. Without `--drafts`, missing dictionaries fail.
- First sandboxed `npx astro check` could not read the published Supabase catalog
  (network request timed out). Re-run with network access succeeded:
  `Result (608 files): 0 errors, 0 warnings, 0 hints`.
- `npm run build`, with the existing test noindex/fixture configuration:
  `171 page(s) built in 13.12s`; canonical/reciprocal alternates checked for 168
  content pages; 70 editorial link/metadata checks; 50 editorial JSON-LD checks.
  All test content remains noindex and the test sitemap has no indexable URLs.

These checks verify the dictionary foundation and the unchanged active IT/EN
build. They do not verify ES/PT rendering, account persistence or email delivery.
