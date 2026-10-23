# Auth local implementation checks

## Task 1: SDK/data/domain foundation — 2026-10-23

The user approved `@supabase/supabase-js@2.118.0` after reviewing its name,
version and purpose. Installed only in `astro-site/`, with an exact version and
lockfile. Node v24.21.0; npm install reported 0 vulnerabilities.

Auth is disabled unless explicitly configured. Configuration requires a modern
publishable key dedicated to the browser Auth integration, an exact site origin,
reviewed providers and an explicit email resend interval. Catalog settings are
not read or copied into browser configuration. No operational values have been
set, and no remote settings or schema were changed.

The SDK adapter restores/verifies existing identity, exposes minimal session
state/subscription, requests Magic Links, obtains Google OAuth URLs and signs out
the current browser. Callback parsing and return-path validation are pure logic.
No user metadata is used for authorization; eventual account data requires RLS.
SDK errors are mapped to neutral reason codes without logging credentials.

Google uses PKCE. Email uses `verifyOtp({ token_hash, type: 'email' })`, without
an originating-browser code verifier. The intended email template places the
hash in the URL fragment, and the callback will require an explicit user action.
This still requires template and allowed-redirect configuration plus authorized
real cross-device testing; adapter tests alone do not verify live delivery.

Actual output:

```text
node --test src/features/auth/data/__tests__/service.test.mjs
tests 7; pass 7; fail 0
npx vitest run src/features/auth/domain/__tests__/auth.test.ts
Test Files 1 passed (1); Tests 6 passed (6)
npx astro check
Result (208 files): 0 errors; 0 warnings; 0 hints
npm run build
92 page(s) built in 20.92s
Complete!
```

Tests use synthetic SDK responses only; no live sign-in emails were requested.
The local request guard and cooldown are UX protections, not backend abuse
protection. Email validation here is syntax-only, not DNS/disposable-domain or
mailbox verification. The remote enforcement described in `auth/PLAN.md` remains
a prerequisite to enabling public email sign-in.

## Task 2: local dialog and callback UI

The configured UI exposes Sign in / Accedi in desktop navigation, the mobile
menu and a direct entry on the wishlist page. A native dialog offers Google and
manual email; signed-in state exposes local signout. It preserves the existing
black/gold theme and local fonts. All messages have matching IT/EN keys. There
are no passwords, user-entered OTPs or implicit reminder subscriptions.

Callback routes are static/noindex, excluded from the normal sitemap. A small
head bootstrap strips search/hash before other scripts, then the callback waits
for Continue before verification. Credentials stay in memory and provider errors
are not rendered/logged. Account synchronization is not implemented or claimed.

Verification with the approved Node runtime:

```text
npm test
tests 98; pass 98; fail 0
Test Files 8 passed (8); Tests 105 passed (105)
npx astro check
Result (220 files): 0 errors; 0 warnings; 0 hints
npm run build
94 page(s) built in 32.19s
Complete!
node qa/auth/verify-built.mjs
Built Auth checks passed: both callbacks noindex/excluded from sitemap,
no-referrer, credentials scrubbed first; default Auth disabled and no browser key emitted.
node qa/auth/browser.mjs
Auth browser checks passed: 4 language/viewport combinations; fresh-browser
email callback, session restoration, local signout, expired link and Google PKCE URL.
```

The browser test uses the actual installed SDK against intercepted synthetic
responses at `https://auth-qa.invalid`, with a fake publishable key. It never
contacts Supabase Auth, Google or Brevo. Tests cover IT/EN at 375px/1440px, invalid
input without sending, duplicate-submission guards, a new browser with no PKCE
verifier for email, URL scrubbing, explicit Continue before verify, safe return,
session restoration and signout without losing guest favorites. Additional
cases check expired links, Google PKCE URL construction, denied localStorage,
disabled JavaScript, direct wishlist entry, Escape/focus restoration and Tab
containment. The initial keyboard test found a Tab escape; explicit boundary
handling fixed it and the final suite passed.

Screenshots are local/ignored under `screenshots/`: `<locale>-<width>-signin.png`,
`requested.png`, `entry.png`, `callback.png`, and `account.png` for each language
and width. Visual review confirmed readable modal layout and no horizontal
overflow at tested widths. There is no legacy Auth interface to compare. Existing
page content is retained; the normal disabled build has no new sign-in entry.
The previously captured wishlist baseline remains in `qa/wishlist/`.

To reproduce the synthetic UI test, start an Astro dev server at port 4330 with
the fake config from `src/features/auth/data/__tests__/service.test.mjs`, replacing
the Auth URL with `https://auth-qa.invalid` and site origin with
`http://127.0.0.1:4330`. The test's 75-second cooldown is a fixture, not an approved
live threshold. Set PLAYWRIGHT_MODULE/QA_BROWSER to external installed tooling
as described in `qa/wishlist/README.md`, then run the script. Do not use real
credentials with this test fixture.

Real activation changes and outstanding approval/verification gates are listed
in `src/features/auth/SETUP.md`. There have been no remote configuration/schema
writes, live authentication submissions, pushes, deployments or domain changes.

## Local Google activation and single-provider copy

The user configured a browser publishable key in ignored `.env.local` and
reported Google enabled in Supabase. A read-only GET of Auth settings confirmed
the configured public key works and `external.google=true`; no credential values
were printed. The user had left the local enable switch off, so it was enabled
under their standing authorization. Only Google UI is enabled locally; email
activation/abuse controls remain pending. No live sign-in was submitted.

The 4330 synthetic server was stopped. The built/static user preview remains on
4322. Browser observation of that actual user tab confirmed SIGN IN in the
mobile menu opens a dialog with Continue with Google. Introductory copy now
reflects the enabled provider(s), so Google-only mode does not advertise an
unavailable email form. Both translations retain matching keys.

Actual verification:

```text
npx astro check
Result (220 files): 0 errors; 0 warnings; 0 hints
npm run build
94 page(s) built in 6.39s
Complete!
node qa/auth/verify-built.mjs --local-auth
Built Auth checks passed: callbacks noindex/excluded from sitemap,
no-referrer, credentials scrubbed first; local Google enabled on 4322;
email UI off; key value not printed.
```

Use `--local-auth` for this deliberately configured local build. The default
verification mode still checks an unconfigured build for absent Auth/browser-key
markup. Neither mode prints a key. The end-user Google account choice/consent
and successful callback/session remain to be tested interactively by the user.
