# Auth activation proposal — not applied remotely

Local UI and adapters are implemented. Auth is still disabled in the normal
build. The separate localhost:4330 design/QA server uses a fake publishable key
and `https://auth-qa.invalid`; it cannot sign in real users. QA intercepts that
origin with synthetic responses. Do not copy its test settings to Supabase or
hosting. The static preview on localhost:4322 keeps Auth disabled.

## Proposed callback configuration

Project: `fabioEgypt` (`iiivnvwspoikfrlclhyr`). Preserve the existing SMTP sender
and catalog configuration. Do not change the live legacy domain or hosting.

For the first real local test, select a single fixed origin and allow the exact
IT/EN callback URLs for it. For the currently running static preview these are:

```text
http://127.0.0.1:4322/it/auth/callback/
http://127.0.0.1:4322/en/auth/callback/
```

The code supplies a `next` query parameter. Supabase redirect matching must be
verified with the exact generated URL before testing; use narrow per-callback
patterns only if required, never a wildcard allowing arbitrary origins. The
allowlisted application destinations are each locale's home, Explore root and
wishlist. All other destinations fall back to that locale's wishlist.

Do not set the global Supabase Site URL to localhost just to add a local test.
Inspect its current use first. No Site URL or redirect allowlist was changed.
The existing test alias is `https://amico-fabio-iyzo.vercel.app`; adding its Auth
callbacks and enabling browser Auth there requires separate hosting approval
and a rebuild. The current deployed artifact has not been updated by this work.

## Google OAuth

Configure a Web OAuth client in Google Cloud and add the Supabase provider
callback shown by the project. With the current project URL it is:

```text
https://iiivnvwspoikfrlclhyr.supabase.co/auth/v1/callback
```

Enter the OAuth client ID and secret directly into Supabase's Google provider
settings. Never put the client secret in chat, website env, source or logs.
Google's callback above differs from the Astro application callbacks. Review
consent-screen audience/test users and allowed website origins before enabling.
Actual Google provider configuration and completion are not yet verified.

## Magic Link template proposal

Google uses PKCE. Email links instead carry a token hash in a fragment and use
`verifyOtp` after an explicit Continue click. That supports opening the email in
a different browser without an originating-browser PKCE verifier. The callback
scrubs its URL before consent/analytics scripts execute. No tokens are forwarded
between devices or stored as pending credentials in browser storage. Reloading
the scrubbed callback before Continue requires reopening the original unused
link; the UI explains that option. This reduces prefetch consumption but cannot
guarantee behavior of every email scanner.

Review this draft subject/body before replacing both **Magic Link** and
**Confirm signup** templates. Do not change password-recovery, invitation or
other templates as part of this proposal. The template is deliberately bilingual
until trusted per-request language delivery is implemented:

Subject: `Fabio Egypt — Accedi / Sign in`

```html
<h2>Fabio Egypt</h2>
<p>Apri il link nel browser in cui vuoi accedere.</p>
<p>Open the link in the browser where you want to sign in.</p>
<p><a href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=email">Accedi / Sign in</a></p>
<p>Se non hai richiesto questo messaggio, puoi ignorarlo.</p>
<p>If you did not request this message, you can ignore it.</p>
```

Every supported request supplies `emailRedirectTo`. Verify template URL handling
using an explicitly authorized test recipient, including new/existing users,
separate browsers and used/expired links. A Supabase dashboard invitation alone
does not verify this Magic Link flow. No live mail was requested in this task.

## Browser environment and protection gates

Use a separately reviewed **publishable** key for browser Auth. The existing
build-only catalog key is not copied into HTML. Populate the new fields in an
ignored `.env.local` or the explicitly authorized test build environment. Keep
`PUBLIC_AUTH_ENABLED=0` until the relevant provider setup and controls are ready.

`PUBLIC_AUTH_SITE_URL` must be the exact origin being opened. It never silently
falls back from a test host to production. `PUBLIC_AUTH_RESEND_SECONDS` must be
chosen to match the actual approved backend setting. The value 75 used in unit
and browser tests is synthetic and is not an operational recommendation.

Before enabling email to public visitors, agree actual limits, sign-in quota
priority, CAPTCHA provider and trusted DNS/disposable-domain enforcement on the
real Auth sending path. Native Auth limits/CAPTCHA operate on that path; a client
cooldown or bypassable wrapper does not. A Before User Created hook only covers
new users, not every later sign-in email. A Send Email hook replaces the built-in
SMTP sending path, so adopting one is a separately reviewed backend decision,
not an automatic change to the Brevo SMTP setup just tested. No hooks/functions,
counter tables, CAPTCHA services or backend settings have been added.

## Remaining account work

Profiles, account wishlists/RLS, lossless guest merge, email preference storage,
automatic invitations/seven-day dismissal and reminder services remain outside
these first local Auth tasks. The UI does not claim synchronization or subscribe
anyone to marketing. Review the table design and obtain remote-write approval
before applying user-data schema. Retention/deletion/export policy is still a
launch gate in PLAN.md.

## Primary references checked

- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook
- https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
