# Spanish and European Portuguese — 2026-11-02

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
