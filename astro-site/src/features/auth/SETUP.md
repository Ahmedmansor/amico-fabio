# Auth activation and remaining setup

Local UI and adapters are implemented. On 2026-10-23 the user reported adding the
redirect URLs/templates and enabling Google after replacing an exposed OAuth
credential themselves. A read-only Auth settings request using the configured
browser publishable key confirmed Google enabled. No OAuth secret was read or
copied into source/local configuration.

Local browser Auth is now enabled for **Google only on localhost:4322**, via
ignored `.env.local`. Email UI remains disabled pending its protection/settings
review. The built site and the actual 4322 browser tab were verified to expose
Sign in and Continue with Google. The user subsequently completed Google login;
the actual restored session/profile/avatar was verified locally (qa/auth/README.md).
The former localhost:4330 synthetic design server has been stopped. Use 4322 for
all subsequent user-facing local tests. Committed source remains opt-in; hosting
variables and deployed artifacts have not been changed.

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
Inspect its current use first. The user added the IT/EN localhost callback
patterns and supplied screenshot evidence; the agent did not change Site URL.
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
Public Auth settings confirm the Google provider enabled. Actual Google login
and callback completion still require the user's interactive test.

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

Account schema is prepared for review in `../../../supabase/account-wishlist/`.
It has not been executed. This includes two user tables and a narrow additional
published-tour identity SELECT grant/policy for authenticated users. Approval
of the older catalog migration does not authorize these changes. Local sync
implementation may proceed behind a disabled activation gate; remote schema and
role-isolation verification remain prerequisites to activation.

Local account-wishlist persistence, lossless guest merge and IT/EN status/retry
UI are implemented and tested with intercepted synthetic services. They remain
off by default through PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED=0. Do not enable the
flag on the real project until the reviewed schema is applied under explicit
authorization and real role-isolation/integration checks succeed. See
../../../qa/wishlist/README.md for results and reproduction steps.

Optional after-save sign-in invitations and seven-day Not now dismissal are
implemented behind the same disabled sync gate. Manual sign-in remains available
while automatic invitations are suppressed. No email subscription is implied.

Remote profile/wishlist tables and RLS, email preference UI and reminder
services remain pending. No one is
subscribed to marketing. Retention/deletion/export remains a launch gate.

## Primary references checked

- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook
- https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
