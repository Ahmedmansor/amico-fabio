# Independent bilingual package pages

All 14 published Google Sheets packages now generate separate Italian and
English pages under `/{locale}/packages/{slug}/`. IDs remain separate from slugs;
the initial slug is the existing stable ID in both languages. Explore cards link
directly to the current language. No production deployment occurred.

## Preserved behavior

Original package HTML, CSS, programs, prices, inclusions/exclusions, badges,
FAQs and booking fields are preserved. Data still flows through `getPackages()`
and `getTrips()`. Required content/images and included-trip relationships are
validated before publication, with package ID/language/field in errors.
Standalone packages with an empty included-trip list keep that original list.
The current package source has no gallery count or metadata entries, so the
package gallery retains its single poster. Included-trip galleries retain the
complete original trip images, optimized through Astro with dimensions.

Included cards retain their three-second image rotation. Clicking a card opens
the original detail modal with its two-second slideshow, thumbnail selection,
body scroll lock and close/backdrop behavior. Modal content is static HTML in
templates; small browser code selects the template, without a global application
controller or a browser data fetch.

Booking reuses the pure total/message functions, passing `kind="package"` to
select the original bilingual package WhatsApp template. Thirty new tests
validate package details and compare all 14 bilingual totals/messages against
the actual legacy BookingManager. No price, policy or business wording changed.

## Evidence and source limitations

- `comparisons.json`: all 28 language pages at 1440×900 and 390×844, 56 matching
  comparisons of text, prices, badges, ordered included trips, gallery counts,
  traveler defaults and input configuration.
- `modals.json`: the included White Island trip modal matches in both languages
  at both widths, including its full content and gallery count. Other included
  trip content/image links are verified in generated HTML, not claimed as
  individually exercised browser modals.
- `booking.json`: the English package invoice matches legacy for two adults
  and one child at €510. Both invoices were cancelled; no WhatsApp confirmation
  was clicked or message sent. Full bilingual WhatsApp wording is unit-tested.
- Matching screenshots remain local and Git-ignored. Auto-rotating photos can
  differ between captures; original image files and their associations are
  checked separately. Minor generated HTML whitespace differs.
- The legacy `global.included_trips` heading key is absent in both languages.
  After migration, the user approved adding `Escursioni incluse` / `Included
  tours` to that key. Historical comparison JSON records the original empty
  heading; this approved addition is the only intended content difference.
  The existing bilingual subtitle is copied from PackagesView into shared
  dictionaries under the same key.
- The invoice retains the legacy English labels (including `Trip:`), while
  the booking message uses the original package-specific language template.
- Shared header/footer routes point to migrated equivalents. Compatibility
  redirects for old `.html?id=` URLs remain a separate pending task.

## Reproduce

From `astro-site/`:

```sh
npm test
npx astro check
npm run build
node scripts/verify-package-migration.mjs
node scripts/verify-tour-migration.mjs
node scripts/verify-explore-migration.mjs
```

Open `/it/packages/sharm_confidential/` and `/en/packages/sharm_confidential/`,
switch languages, open an included trip and select its thumbnails, close it,
change travelers, fill the booking fields and cancel the invoice. No libraries
were installed, no legacy files were edited, and no domain/deployment changed.
