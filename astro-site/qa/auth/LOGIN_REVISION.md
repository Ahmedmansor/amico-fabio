# Standalone login verification — 2026-10-28

Node 24.21.0, migration branch. No new dependencies. Existing Supabase SDK
2.118.0 supports password/signup/Azure and CAPTCHA token forwarding. Turnstile
uses its official vanilla browser API, loaded only on the login page.

Local implementation provides `/it/login/`, `/en/login/`, Italian `/login/`
alias, header/wishlist navigation, safe same-origin return destinations,
password signup/signin, existing-account-only Magic Link recovery in password
mode, Google/Azure OAuth (`email` scope), and authenticated password setting.
The shared popup contains signed-in account controls only. Existing account
wishlist merge and reminder/onboarding services are unchanged.

Native CAPTCHA verification is Supabase's responsibility. Browser validation is
not evidence that direct Auth endpoints are protected. Password/Microsoft flags
default off; password signup requires a site key and enabled reviewed email flow.
No remote flags, provider settings, schema or deployments were changed here.
The backend callback allowlist source also accepts safe catalog return paths;
redeploy its existing signed hook before activating those paths for email.

Real command results:

```
npm test
tests 377; pass 377; fail 0
Test Files 24 passed (24)
Tests 197 passed (197)

npx astro check
Result (434 files): 0 errors; 0 warnings; 0 hints

npm run build
Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings
output: static
99 page(s) built in 11.50s
Complete!
```

`login-browser.mjs` passed IT/EN at 375 and 1440px using synthetic Auth and
Turnstile routes; see `login-browser-results.json`. It covers rejected-input
zero requests, explicit typo correction, expired CAPTCHA, unconfirmed signup,
existing-only recovery, password sign-in without email, authenticated password
setting and account dialog/signout. Cookies are explicitly declined for visual
capture. No horizontal overflow. Screenshots are local and ignored under
`qa/auth/screenshots/login-*`; this is an authorized new page, with no legacy
standalone login equivalent. Header, colors, fonts and footer reuse the site.

Reproduce from astro-site with the bundled Playwright module/executable set in
`PLAYWRIGHT_MODULE`/`QA_BROWSER`, and `QA_ORIGIN` pointing to an isolated fixture
server. Fixture sets all Auth providers on with synthetic URL/key/sitekey, same
origin matching QA_ORIGIN, password mode on, cooldown 60, and all wishlist account,
locale, onboarding, reminder, management and summary-test flags off. Every Auth
and Turnstile request is intercepted. Never use live keys or delivery for this
fixture. Default QA origin is http://127.0.0.1:4332.

Remaining activation: real public Turnstile site key, native secret verification,
Azure provider setup, password policy, confirmed-email behavior, existing hook
deployment, matched test build, and user-requested real acceptance. Marketing
consent is a separate implementation; signup metadata currently defaults false
and is not a durable permission grant. No promotional sending is enabled.

Follow-up: `/login/` alias runs its safe handoff inline, before meta refresh can
drop the requested return path. Its browser assertion passed, alongside all four
login scenarios. Astro check covered 445 files without diagnostics and static
build generated 99 pages in 12.31s. Optional marketing local foundations are now
documented in MARKETING_CONSENT.md; their flag remains off. The signed Auth hook
was separately deployed as v6 (see hook-revision-2026-10-28.json); page hosting
and new provider flags are not updated by that Edge deployment.
