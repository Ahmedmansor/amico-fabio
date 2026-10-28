<!-- Current target: LOGIN_REVISION.md, approved 2026-10-28. Historical checkpoints below describe earlier artifacts. -->

# Auth activation and remaining setup

## Current login revision — 2026-10-28

Email OTP length is now 6 in Supabase and the local domain/UI. The six-cell
widget requires the complete code; old eight-digit emails need a fresh request.
Only auth.email.otp_length changed remotely; all 24 undeclared settings remained
unchanged. See qa/auth/OTP.md for focused verification and the reviewed config.

Use [LOGIN_REVISION.md](LOGIN_REVISION.md) and
[KEYS_SETUP_AR.md](../../../qa/auth/KEYS_SETUP_AR.md) for the current activation.
The local password/Google/Turnstile page and separate optional offers-consent
foundations pass synthetic checks but their hosting flags remain off. New consent
schema and native SQL tests remain unapplied/unexecuted. The existing signed
Send Email hook alone is updated to ACTIVE v6; actual unsigned POST returned 401.
No new inbox test or promotional sending is implied.

Do not enable native CAPTCHA on the old hosted artifact before the matching login
page with token forwarding is deployed. Actual test hostname is
`amico-fabio-iyzo.vercel.app`, project `amico-fabio-test`. Preserve Google and
existing limits, hook signing, source snapshots, and restricted reminder scope.
Rollback source for hook v5 is ignored locally at
`.astro/auth-send-email-v5-rollback.json`; no secret values are stored there.

## Verified test activation — 2026-10-27

The real Auth sending path is now connected to the signed HTTP hook. This replaces
SMTP dispatch; stored Brevo SMTP settings remain unchanged as configuration only.
This checkpoint supersedes earlier claims that SMTP and the HTTP hook both send
Magic Links or that deployment alone proved end-to-end readiness.

- Installed the missing signing secret securely; Edge `auth-send-email` v4 is
  ACTIVE. Unsigned POST returns 401; correctly signed reserved-domain requests
  reach validation without sending mail.
- Enabled Send Email and Before User Created hooks through a reviewed, selective
  config push. Eighteen undeclared settings, including Google, MFA, redirects and
  SMTP credentials/configuration, were left unchanged.
- Actual `signInWithOtp` rejects a maintained temporary QA domain with 403 before
  user creation. Actual Auth-to-HTTP-hook invocation rejects `example.invalid`
  with 400 and the intended domain message. Both left zero test users.
- Authenticated business failures use HTTP 200 with `error.http_code`; transport
  4xx was empirically producing GoTrue's generic 500 instead of the intended error.
  Unsigned requests still receive HTTP 401; confirmed provider acceptance or an
  already-accepted replay returns {}.
- Native remote role assertions passed with ROLLBACK. Independent DB sessions
  433810/433830 returned send/uncertain; the contender waited 778.497ms on the
  owner lock. The exact fixture and its quota contribution were removed.
- Limits: 100 Auth attempts per UTC day, 30/hour, 5/recipient/hour, cooldown 60s.
  Existing restricted reminder recipients and consent behavior are unchanged.
- Local and stable Vercel test pages in IT/EN expose working email controls,
  `emailEnabled=true`, Google enabled, resendSeconds=60 and noindex. Test project
  is `amico-fabio-test`, not protected production project `amico-fabio`.

Inbox receipt and manual new/existing-user cross-browser verification remain the
user's final acceptance test. Negative-path verification did not send real mail.
The email callback requires explicit Continue before consuming the token; do not
claim clicking the email immediately signs in. Unsupported recovery/invite/email
change events are outside the enabled Google/Magic Link UI and remain blocked.

See `qa/auth/activation-2026-10-27.json` (from astro-site/) for exact evidence and
`supabase/functions/auth-send-email/README.md` for operation/rollback details.

## Current closure checkpoint — 2026-10-26

PLAN.md's Current closure scope supersedes the historical next-task handoffs below.
The real Google no-consent registration + favorite-save test passed: one tour,
no preference row, zero consent grants and zero reminder jobs. Magic Link for
non-Google email is required to finish the scope, with server-enforced syntax/domain
and known disposable-email validation and sending protection on the real Auth path.
It is not activated or verified merely because callback/client code exists.

The user approved administrative deletion requests through the existing public
contact info@fabioegypt.com; a self-service account deletion button is deferred.
Document and implement IT/EN request instructions and the verified admin process.
Review the ongoing uncommitted cache changes separately. Final real reminder
email/withdrawal testing is still outstanding; no sending scope was expanded by
this plan update, and the user's confidence in the logic is not delivery evidence.

## Current next task — post-login welcome (2026-10-26)

Follow PLAN.md's Approved next task and handoff, section 4 (approved flow), and
section 4.2 (numbered implementation tasks). The user approved favorites-reminder
onboarding after first registration, no pre-login checkbox and no offers/newsletter.
Sign-in shows standard linked Terms of Use/Privacy acknowledgement; do not display
an explanatory sentence about login not subscribing users to emails.

Starting revision: 1b8f7aa. Existing Google, guest/account tour/package favorites,
consent safeguards and unified-language SQL are the baseline. Welcome state/dialog
are not implemented by this documentation update. First prepare durable account
onboarding eligibility/completion and local domain tests/SQL proposal; implement
local flow behind a gate. Existing accounts must not be treated as new because a
new onboarding record is absent. New remote schema, fixture writes and deployment
retain their separate gates. Retire the old pending-optin execution path when
switching flows, preserving account isolation, retry and withdrawal protections.

## Current language and autonomy contract — 2026-10-25

The latest user instruction makes the customer's last supported site language
also the language of future emails. PLAN.md section 6.1 is authoritative: persist
changed signed-in language, use it at dispatch, preserve consent/timing, and do
not keep an independent email override against a newer site choice. Routine
implementation decisions proceed autonomously under PLAN.md's Decision autonomy
section. This documentation update does not change runtime or deployment.

The checkpoints below are historical evidence. Their independent-language and
follow-site/explicit-override descriptions are superseded as product policy;
implementation alignment and verification remain outstanding.

## Latest implementation checkpoint — 2026-10-25

Reminder dropdown fix: it is no longer locked after first consent. A changed
language enables Save preference and uses the existing explicit locale service;
language-only saves do not grant consent or reset its start time. No backend SQL
or service deployment change. Implemented without running tests/build or saving
the real user's preference, as explicitly requested. This supersedes instructions
that require opening account settings to change reminder language.

Manual QA correction: wishlist-email-test v5 uses saved correspondence language
from the server and the actual reminder template/management links. Browser page
locale is neither sent nor accepted. Consent must already be enabled; save does
not happen implicitly. A final snapshot check blocks withdrawal/language changes
during preparation. QA jobs remain separate from automatic dispatch. Replays say
already-sent instead of implying another email was sent. The corrected test has
fresh bounded per-language IDs; previous accepted summaries remain in their ledger.
The old PUBLIC_WISHLIST_EMAIL_TEST_PAGE_LOCALE_ENABLED protocol is retired.

Local dev recovery verified: the Google button was disabled with unavailable Auth
because Vite served its optimized Supabase module with HTTP 504. Restarted only
the verified Astro process on 4322; the same module returned 200. Reload restored
the existing real account and both tour/package favorites. No session/browser
storage was cleared, no sign-out was forced and no email was sent. A disabled
button's wait cursor was mistaken for hover-triggered loading; there is no hover
Auth handler. If this dev-only 504 recurs, restart the existing dev server and
reload the page. Do not reinstall Astro or recreate the project.

Restricted activation was explicitly approved and applied. See
../../../qa/reminders/ACTIVATION.md for deployed versions, SQL evidence and limits.
Google/sync/explicit reminder preferences and management pages are now enabled on
localhost 4322 and amico-fabio-test. The real site's main/domain are unchanged.
Committed flags remain off; only the authorized test project and ignored local
settings are enabled. Immediate QA sending remains local only.

Cron is scheduled every 15 minutes. Its fixed Brevo callback is now ready:
bootstrap returned 200/configured and webhook_ready=true. User separately approved
Webhooks Read/write on the existing restricted key and completed Brevo verification.
Dispatch v6 handles the verified empty-account 400/document_not_found response;
all other setup failures remain closed. No raw provider text or credential is
exposed. Do not reset real consent or blindly retry unknown sends. Actual mailbox
delivery remains a user integration check, not proved by successful registration.

Prepared user checks after that gate: Google login on the test host; add a tour
and package; choose and save reminder language/consent; change browsing language
and verify the saved account/email language follows it after implementation
alignment. On localhost wishlist only, QA sends once in each page language within its renewed 24-hour window. Real reminder
is one message after 24 hours from the later of consent/last actual addition.
Its management link opens without login, expires after 90 days and supports
explicit language save/withdrawal. Withdrawal never requires signing in again.

The following older handoffs are historical and superseded by this checkpoint.

## Current handoff — 2026-10-24

- User authorized real schema activation and separately authorized disposable
  Auth/catalog role-test writes with ROLLBACK. profiles, wishlists and
  package_wishlists are applied on fabioEgypt, with ownership RLS and the
  reviewed narrow trips/packages lookup grants. Do not rerun schema.sql.
- Real SQL role assertions passed for own operations, cross-account/anonymous
  denial, duplicates, timestamps, published items and account cascades. Rollback
  left zero qa_wishlist_* catalog records. Security advisor reports only the
  existing Auth leaked-password-protection warning; no user-table RLS finding.
- Ignored .env.local now sets PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED=1. The actual
  4322 page exposes the bootstrap, and real anonymous REST returns 401 on all
  three account tables. Committed defaults and hosting variables stay off.
- User confirmed real synchronization works on 2026-10-24: favorites restore
  across browsers, removals propagate after refresh, and duplicate guest items
  do not create duplicates on login. This is user-reported integration evidence;
  the agent has not extracted or accessed the user's session.
- Account synchronization evidence: ../../../qa/wishlist/LIVE_SYNC.md.
  Restricted summary email sending was subsequently activated and received;
  automatic reminders remain off. See the email handoff below.
- Email preparation now includes /tours-manifest.json for published tours and
  packages and local IT/EN summary/reminder templates with inline styles and
  plain text. Preview source and regeneration: ../reminders/README.md. Preview
  unsubscribe is inert. User chose all available saved items without a card cap.
  Draft opt-in UI is implemented in an isolated preview, not mounted on the site.
  Timing/re-addition policy was approved on
  2026-10-24: 24h after max(last real addition, consent), one reminder only;
  empty list cancels and re-addition before the first send restarts waiting.
  Durable scheduling, quota controls, unsubscribe/suppression and final release
  review remain gates for automatic reminders. Sender and one restricted test
  recipient were approved for the summary test, not general customer sending.
- Reminder preferences now have a local backend service/repository, remote
  getUser-based Auth verifier and portable HTTP handler (explicit origins,
  bounded JSON, verified ownership). Its Edge composition is deployed below.
  Two tables + service-role-only atomic RPC were separately authorized and
  applied on 2026-10-24; rollback role tests passed and left zero records.
  Source: ../../../supabase/reminder-preferences/; evidence: ../../../qa/reminders/PREFERENCES.md.
  Authenticated website integration remains required before showing live opt-in.
- The browser HTTP client and account-aware preference controller are prepared
  and tested locally. They reject malformed confirmations, isolate late replies
  after account changes and preserve request identity on explicit retries. They
  are not mounted in the actual wishlist and never store bearer tokens or
  consent in localStorage. The draft opt-in component/binder is implemented and
  browser-tested in isolation; a gated source binding now exists below, while
  real authenticated website saving remains unverified.
  Do not mount or enable it before approved wording, runtime controls and a
  deployed verified endpoint are ready. See ../../../qa/reminders/README.md.
- The composed Edge preference service is now prepared locally under
  ../../../supabase/functions/wishlist-email-preferences/. Its checked-in
  configuration was explicitly approved and enabled on 2026-10-24. The counter
  schema is applied, rollback role tests passed, and service version 2 is ACTIVE.
  Live smoke checks passed: preflight 204, anonymous/invalid bearer 401, denied
  origin 403. Authenticated saving from the website remains untested/unmounted.
  Current Node tests exercise real SDK calls against synthetic fetch responses;
  local native Deno checks were not run; deployed startup/smoke checks are real.
  No Deno/CLI was installed.

## Current restricted email handoff — 2026-10-24

Email update 2026-10-24: the authorized test deployment and restricted
wishlist-email-test Edge Function are active. The ignored local .env.local
enables the button on port 4322 for one account and one short job window; hosting
defaults remain off. The user confirmed receiving the actual favorites summary
in Gmail Promotions. The original one-job window is expired. Follow
../../../qa/reminders/BREVO.md for the current status and safe retry guidance.
The first authenticated attempt was blocked by wishlist SELECT permission
before any Brevo dispatch. Version 2 uses the caller's existing authenticated
RLS for favorites reads; no service_role table privileges were added. Reload the
local wishlist page when testing an authorized active job.
The requested IT/EN WhatsApp booking actions are prepared and checked in the
local email templates. Preview generation is documented in reminders/README.md;
an earlier preview used port 4333, which is not a guaranteed running server.
The user then approved a
second test: function version 3 includes the CTA template, with a fresh ignored
job configured to expire 2026-10-24T18:02:33Z. The user subsequently confirmed
receipt of the updated email and the correct per-item WhatsApp booking message.
This is user-reported integration evidence, not a new provider-log inspection.
Do not extend the job or send another email without its required authorization.

## Locale continuation — applied storage, local integration pending

The canonical contract is [PLAN.md section 6.1](PLAN.md#61-approved-language-and-request-contract--2026-10-24).
It separates page URL, profile language and follow-site/explicit correspondence
language; documents atomic ownership-verified writes, ordering/retries and realistic
request costs. Documenting the design alone did not activate it.
Continuation implemented the local domain/service/RPC repository with 17 passing
tests. The separately authorized [SQL delta](../../../supabase/account-locale/README.md)
is now applied (`20261024203756`); two-account rollback tests passed and cleanup
was verified. Local coordination, transport and gated header/account binding are
implemented. Live endpoint/flag remain off and actual overlapping-connection
testing is not claimed. Checks and limits:
[LOCALE.md](../../../qa/auth/LOCALE.md). No new dependency or live flag change.
The local [account-locale service package](../../../supabase/functions/account-locale/README.md)
now includes browser HTTP transport and a protected handler; configuration stays
disabled. Prepare with `node qa/auth/prepare-locale-function.mjs` (13 files).
No upload/deployment, native Edge verification or real authenticated locale save
is claimed. The gated binding reuses Auth's existing restored identity. Set
`PUBLIC_ACCOUNT_LOCALE_ENABLED=1` only after endpoint activation/integration;
default/hosting/ignored local flags have not been enabled. It requires Auth and
account profiles and derives the endpoint from that Auth project. Cache is
per-tab/account, five minutes; pending recovery is 24 hours with one automatic
same-ID attempt after navigation, then manual retry. None of this changes consent.
The current test job fixes English; switching to Italian does not yet localize
that test. Preference UI is not mounted. Google Auth/account sync are local-only;
the static Vercel test catalog exists but its Auth flags/redirects are not enabled.
Production remains static GitHub Pages. Do not introduce middleware or SSR.

Local page-locale email protocol is prepared behind
`PUBLIC_WISHLIST_EMAIL_TEST_PAGE_LOCALE_ENABLED=0`; leave it off for deployed v3.
Its locale-aware handler and a fresh approved job/window must be deployed before
a real IT/EN sending check. Each restricted job has one immutable locale/key.
No external email, renewal or provider change occurred in this continuation.
Header, wishlist and summary UI now reuse the Auth-owned minimal account-state
feed, rather than separately restoring/verifying the same browser session.
Four synthetic full-shell browser cases measured one initial client getUser,
and verified signout/home behavior. This is an in-page identity cache only;
it does not replace remote verification or RLS on any backend request.
The actual wishlist route now has a gated preference bootstrap, using
`PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED=0`. Its bridge and four native-page
synthetic cases passed. It requires Auth/profiles/locale flags, shares identity
and never writes without explicit Save. Do not activate opt-in before automated
delivery, unsubscribe and final wording review. No real consent was stored.

## Previous handoff — 2026-10-23 (historical; superseded above)

- Local Google Auth/profile/header is available on 4322. The user's server and
  signed-in browser were not stopped or signed out during isolated QA.
- Account wishlist persistence, read-back merge, cross-tab refresh, error/retry
  UI and optional seven-day sign-in invitation are implemented and tested with
  synthetic services, including a plain static build. They remain disabled in
  the actual local environment and all hosting configurations.
- Remote profiles/wishlists tables do not exist in the last read-only preflight.
  Review ../../../supabase/account-wishlist/README.md and schema.sql. The exact
  write scope now includes three user tables (profiles, wishlists,
  package_wishlists)/ownership policies plus authenticated SELECT of published
  trips(id,is_active) and packages(id,is_active). The package extension was
  requested on 2026-10-24. Prior catalog approval does not cover it.
- role-tests.sql is prepared but NOT RUN. Its disposable Auth/catalog fixtures
  and rollback require explicit test-write approval. No real-user data is used.
- After approved schema execution, successful real role tests and integration
  checks, enable PUBLIC_WISHLIST_ACCOUNT_SYNC_ENABLED=1 locally. Production/test
  hosting changes and deployment retain their separate authorization gates.
- Email remains off. Rate-limit numbers, quota reservation, CAPTCHA and trusted
  DNS/disposable-address enforcement, retention/deletion/export and optional mail
  consent/services remain decisions for the relevant later phase.

See PLAN.md for the current flow and ../../../qa/wishlist/README.md for actual
test outputs. Local mock success is not proof of remote RLS or email delivery.

## Previous activation notes

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
