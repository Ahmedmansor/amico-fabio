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
