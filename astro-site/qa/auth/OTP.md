# Email code with alternative link — 2026-10-28

User preference: read the email on a phone and enter its code in the requesting
laptop/browser. OTP is primary; the same email retains the existing alternative
link. Both consume the same one-time verification: the first successful use wins.
The alternative link signs in its own browser, not the originating browser.
Local 127.0.0.1 links work only on the computer hosting the local app. The code
does not require opening a callback on the phone or transferring PKCE storage.

The signed hook renders the provider-generated numeric token in matching IT/EN
HTML/plain text. It validates the token before DNS/quota/send. The existing token
hash callback, explicit link-confirm action, delivery hash ledger, HMAC and Brevo
limits are preserved. One email contains both methods; verification sends no
additional email. Codes/tokens never go into logs, analytics, browser storage,
URLs or the delivery ledger. Native Supabase expiry, single-use and verification
rate limits remain the backend enforcement; the 3-second UI/service retry guard
is convenience only and cannot prevent direct endpoint bypass.

After signup/recovery the page hides the original form and shows code entry for
the captured submitted email. Wrong/expired/used codes remain signed out. Leading
zeros are preserved. Successful verification creates the session in this browser
and returns to its safe destination, reusing the existing wishlist merge. Optional
marketing activation remains behind its existing disabled flag; failure cannot
block account access. Explicit resend uses a new CAPTCHA and the shared cooldown;
signup resend needs no retained password. Existing-account recovery never creates
another account. An alternative link used on a different browser cannot transfer
guest favorites from the first browser: sign in there separately afterward.

Focused actual results, no broad rerun per user instruction:

```
node --test .../password.test.mjs .../auth-send-email.test.mjs
tests 31; pass 31; fail 0

vitest run src/features/auth/domain/__tests__/login.test.ts
Test Files 1 passed (1); Tests 4 passed (4)

deno check supabase/functions/auth-send-email/index.mjs
Check supabase/functions/auth-send-email/index.mjs
exit 0
```

`otp-browser.mjs` passed IT/EN with a synthetic session, email delivery and
CAPTCHA. All Supabase requests were intercepted. It covers the replaced form,
invalid format, wrong/used server rejection, preserved leading zeros, same-browser
session without verifier storage and no second mail request. See its result JSON.
No real code was requested or consumed by the agent; never use screenshot tokens.
The early temporary check-email fixture failed because its CAPTCHA reset stub
did not supply a new token; the corrected targeted OTP fixture passed.

Real inbox code and cross-device acceptance remain the user's test. Previously
delivered emails cannot acquire a code after this update: request a fresh email.
No production page/domain or marketing schema/sending scope is changed.

Official references:
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/reference/javascript/auth-verifyotp
- https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
- https://supabase.com/docs/guides/auth/rate-limits
