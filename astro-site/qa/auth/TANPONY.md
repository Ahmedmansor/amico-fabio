# Confirmed disposable-provider incident — 2026-10-28

User reported successful real six-digit OTP entry and confirmed the disposable
provider tanpony.com. It exists in the offline maintained snapshot (line 8225)
but that bulk catalog was deliberately not activated. A native read showed the
active table lacked it and validation returned ok. Added only this confirmed
manual block, preserving the earlier decision against bulk activation.

Actual native validation after applying block-tanpony.sql:
- tanpony.com: disposable-domain
- sub.tanpony.com: disposable-domain
- libero.it: ok
- fabioegypt.com: ok

The frontend rule and fresh-install seed match. The four focused catalog tests
passed. Existing SQL Before User Created and send-reservation checks consume the
active table; no Edge redeployment or broad list activation is needed for this
server-side block. No new email was sent or live signup attempted by the agent.

The user then explicitly requested deletion of their exact temporary test
account. One account was matched before deletion. The transaction checked for
in-flight mail, suppressed any pending jobs, revoked its refresh tokens/sessions,
then removed that account and its FK-cascaded records. Verification returned
zero remaining accounts, sessions, profiles, tour favorites, package favorites
and reminder jobs for that account. No other account was targeted. Hash-only
anti-abuse delivery/quota evidence was retained; no identifying values are
stored in this report. Existing browser tokens may remain until refresh/signout;
deletion is not a claim that all previously issued JWTs instantly expire.
