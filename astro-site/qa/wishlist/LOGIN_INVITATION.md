# Sign-in invitation continuation — 2026-11-03

Accepting the guest invitation previously hid it only in the current document.
The next login document rendered it again for the same saved items. Invitation
markup is now excluded from login/Auth routes, including direct login without
storage. Acceptance persists the existing seven-day suppression just like Not
now; guest favorites are untouched. No session, consent or account operation.

Actual checks: invitation Vitest file 7/7 passed; Astro check 734 files with
0 errors/warnings/hints; static build 572 pages completed (57.21s).
WebKit iPhone touch test: all five languages passed the two-item threshold,
accept/sign-in navigation, reload, direct-login exclusion and preservation of
both guest favorites. See login-invitation.mjs and login-invitation.json.
Public Auth origin is rewritten only in the test transport to the local server;
all external requests are blocked. No real login, mail or deployment.
