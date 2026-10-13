# Home migration verification

Migrated only the home page to `/it/` and `/en/`. The root setup page remains
unchanged until root/legacy redirect work is authorized. No legacy files changed.

The hero's three slides, Fabio portrait/background and full biography, three
destination cards, all 13 reviews and their dates/ratings, Facebook review link,
footer, WhatsApp contact and promo text come from existing sources. Reviews
are duplicated into 26 cards for the original scrolling animation. Original CSS
selectors and their cascade are retained. Source images are copied unchanged;
Astro produces optimized images with dimensions and responsive hints.

Google Sheets continues to supply promo settings via `getGlobalSettings()`.
Activation still depends only on `is_active`; expired date metadata does not
disable the promo. No price, booking, discount or included-trip policy changed.

## Comparisons and differences

Screenshots under `screenshots/` and read-only browser DOM captures compare
legacy and Astro in both languages at desktop 1440 × 900 and mobile 390 × 844.
Lazy images were loaded before final captures. Domain tests compare complete
home dictionaries against the actual legacy JavaScript dictionaries.

- Missing sections, visible text, source images, reviews, destination links or
  prices: none found. Home does not display trip/package prices.
- Slider frame and review position differ between screenshots because both
  retain their original running animations (3-second slides, 38-second reviews).
- Minor scrollbar/spacing differences remain; no layout redesign was made.
- Promo now reads the route's language, fixing the documented `lang` versus
  `fabio_lang` storage-key mismatch. The existing English sheet value is used.
  The legacy English screenshot still shows its Italian promo; intentional fix.
- Header home/trips/reviews and legal links now use their migrated language
  routes. Destination links now reach `/<locale>/explore/<location>/` following
  the explore migration. Guide links still reach the production legacy page.
  Blog keeps its existing
  `#` placeholder. No tour or package routes were added in this task.
- Legacy home SEO title/description are only provided in Italian, even after
  switching the legacy page to English. They are retained in both dictionaries;
  no English SEO copy was invented. An approved English translation can replace
  them later. Existing legacy accessibility literals are also retained.
- The original banner can cover the open language dropdown; dismiss it before
  switching languages. This interaction remains visually identical to legacy.

Verified interactions: biography opens/closes; promo dismisses after 500 ms;
language menu navigates between home equivalents after promo dismissal;
floating WhatsApp hides when the footer is visible; all images load and no
horizontal overflow occurs at tested widths. No booking message was sent.

## Reproduce

From `astro-site/`:

```sh
npm test
npx astro check
npm run build
node scripts/verify-home-migration.mjs
node scripts/verify-legal-migration.mjs
```

Open `/it/` and `/en/`, check the hero, biography button, destination links,
reviews, banner dismissal and language switch on mobile and desktop. The
one-time extraction script reads legacy files and writes only Astro files;
it is not a runtime dependency. No library was installed for this task.
