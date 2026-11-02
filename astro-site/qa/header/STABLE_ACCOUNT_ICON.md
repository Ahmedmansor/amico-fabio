# Stable account icon during full-page navigation — 2026-11-02

Cause: AuthTrigger rendered `data-avatar-loading="true"` on every static page,
and its CSS hid every child, including the neutral account icon. Session
restoration removed that mask, producing a repeated disappearance. The later
avatar renderer also hid its fallback before the image finished downloading.

The account outline now renders visibly in static HTML. Session readiness no
longer masks it. A valid profile image replaces the outline only after load;
delayed/failed images retain the outline. Existing signed-in dialog, login,
session storage, refresh, signout and ownership behavior are unchanged. No new
profile cache or request was introduced. Earlier shimmer assertions in historical
header QA describe the superseded appearance, not this acceptance contract.

The site still uses full static documents per navigation. SDK initialization
occurs in each document; its page-local shared service/state prevents duplicate
restoration within that document. `currentSession()` uses SDK `getSession()`;
it does not call `getUser()` per navigation. Valid persisted sessions are read
locally; an expiring session may require a refresh. This is display state, not a
substitute for backend/RLS authorization. Other feature HTTP requests are outside
the zero-Auth-request claim.

## Actual focused verification

```text
Account icon: 7 focused cases passed.
Guest and signed-in synthetic sessions: three page loads each.
Icon visible before external JavaScript; stable trigger geometry.
Delayed/failed avatar retains fallback.
ZERO Auth HTTP requests with a valid stored session.
npx astro check: Result (626 files): 0 errors, 0 warnings, 0 hints.
Noindex demo-preserving build: 285 page(s) built in 18.69s; Complete!
88 editorial pages checked for links; 68 visible JSON-LD contracts verified.
```

`stable-icon.mjs` runs the real bundled SDK with synthetic browser-only session
data. It intercepts all nonlocal traffic and rewrites the test Auth config to a
synthetic endpoint. There are no real accounts, tokens, emails or Auth requests.
Screenshot pairs remain ignored and local; results are in
`stable-icon-results.json`. The test does not claim real account sign-in or
server-side session-revocation verification.

Check/build used process-local `BLOG_INCLUDE_FIXTURES=1`, `PUBLIC_NOINDEX=1` and
`PUBLIC_SITE_URL=http://127.0.0.1:4334`, preserving the existing preview articles
and guides without removing their guards or changing production publication.
No dependency, provider, database or deployment changes.
