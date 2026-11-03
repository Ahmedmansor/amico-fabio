# Wishlist request reduction — 2026-10-28

- Previous small-list mutation: one write, one populated tour read, an empty tour pagination probe, and one package read (four requests in the user's trace).
- Updated repository requests exact remaining counts, avoiding the empty probe when the last page is confirmed. Typical mutation: one write plus two table reads (three requests); larger lists still paginate. Missing counts retain conservative probing, and inconsistent counts fail.
- Overlapping focus/visibility refreshes share one operation per account generation. A queued refresh rechecks cache after preceding confirmed writes. Fresh cache from another tab updates local state without a network read.
- Five-minute cache freshness is unchanged. Returning after expiry revalidates for changes on other devices; there is no interval polling. Successful writes still require read-back confirmation; guest cleanup and account ownership checks are preserved.
- Focused Node tests: 29 tests, 29 pass, 0 fail. Covers server row caps, missing/inconsistent counts, overlapping refreshes, queued writes, cross-tab cache, stale account responses, silent write denial and guest preservation.
- `npx astro check`: 449 files, 0 errors, 0 warnings, 0 hints. Corrected pre-existing SVG `hidden` typing in the password eye icon using SVG `visibility` in markup and handlers.
- `npm run build`: 99 static pages built in 14.83s, Complete. Local public Turnstile key supplied through its canonical public build variable without printing it. Initial sandbox catalog timeout and initial missing public-key build configuration were resolved for this successful run.
- Request reduction is repository/coordinator test evidence, not a newly captured authenticated browser trace. No account writes, emails or schema changes were performed for this check.
