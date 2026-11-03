# User-requested reminder consent read — 2026-10-28

The user confirmed real registration/OTP and requested checking their new test
account's welcome checkbox. A read against the exact identified account returned:

```
email_verified: true
preference.enabled: true
preference.locale: en
preference.enabled_since: present
preference.wording_version: wishlist-reminders-v1
consent grants: 1
consent withdrawals: 0
reminder jobs: none
```

This verifies durable favorites-reminder consent, not offers/newsletter consent
or reminder delivery. No account settings, recipient scope or mail queue were
changed by this read. No email was sent by the agent. Account identifiers/email
are omitted from this report. The separate promotional-consent feature remains
disabled with unapplied SQL; do not conflate these two permissions.

The same read confirmed aiaur.com is not in the active disposable-domain table
and current validation returns ok. It was also absent from the offline snapshot.
The user explicitly set aside further temporary-domain work in this request;
no aiaur.com block, bulk import or account deletion was performed. Detection of
known providers is not a guarantee that every new temporary domain is blocked.
