# Guest favorites count without navigation flicker — 2026-11-02

Two causes: static HTML initially hid the badge until module loading, and global
Auth pending CSS independently hid the heart/count while restoring identity,
even when guest favorites were already available in localStorage.

A synchronous inline bootstrap immediately after the header link reads the
existing per-trip and per-package guest records before the first paint. It uses
the same self-contained pure parser as `readGuestSnapshot`, serialized from its
compiled function at build time. No runtime eval, extra request, count cache,
duplicated record parser, token decoding or storage write is introduced. Both
legacy revision `1` and current revision IDs retain their semantics, including
acknowledged-entry exclusion and canonical typed IDs. Account-session presence
is a display hint to skip guest prepainting; it grants no access or ownership.

Wishlist visibility no longer depends on Auth pending. Genuine wishlist loading
still uses the feature's own state. Existing coordinator, account sync, guest
merge, add/remove and cross-tab listeners remain in control after hydration.
Unavailable/invalid storage falls back to existing feature error handling.

## Real focused verification

```text
Pure record parser: 2 Vitest cases passed.
Existing guest-storage regression suite: 9 passed, 0 failed.
Guest wishlist count: 5 focused browser cases passed.
Astro check (632 files): 0 errors, 0 warnings, 1 unused-import hint.
Noindex demo-preserving build: 285 pages built in 16.34s; Complete!
```

The unused `favoriteKey` import reported as a hint was removed during final diff
review; no claim is made of a later full check. The browser test intentionally
holds all module downloads to verify the combined guest count (two tours and a
package) before they execute. It visits home, explore, a tour and wishlist,
checks the count also stays visible during forced Auth pending, and records
zero blank sampled animation frames and stable badge geometry. Adding a tour
updates 3→4; removal from another tab updates 4→3. Zero Auth/rest endpoint
requests were observed, and no external traffic was allowed. This is an
isolated synthetic browser context, with no real account or external writes.

Evidence: `guest-count-results.json`, `guest-count.mjs` and ignored local header
screenshots. No broad unrelated test suite was run. Existing demo blog/guide
content was retained in the local noindex build. No hosting, dependency,
provider configuration, production domain or legacy source was changed.
