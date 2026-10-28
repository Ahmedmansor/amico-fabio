# Registration names and password confirmation — 2026-10-28

The user requested first/last name and repeated-password entry. Email signup now
collects both names, validates nonblank bounded international display text, and
saves first_name, last_name and full_name in Auth display metadata. The existing
profile/header code displays full_name. Metadata remains display-only, never an
authorization or ownership source. Google sign-in and existing accounts are not
forced through these fields; no account metadata was backfilled or overwritten.

Signup and optional account password setting require an exact matching repeat
value. Mismatch shows IT/EN inline error and disables submission. The data-layer
service also refuses mismatches before invoking the SDK. Confirmation values are
never sent as metadata or retained; password fields clear after submitted requests.
Normal sign-in still has one password field. Required names are site-form/service
validation, not a claim that direct Supabase Auth requests require name metadata.

Focused actual checks: 12 service tests passed; 5 domain tests passed. The existing
IT/EN OTP browser fixture additionally passed missing-name feedback, mismatch
blocking, zero requests for mismatches/confirmed disposable email, signup full-name
metadata, greeting after mocked verification, and matching-repeat enforcement
when setting a password. All Auth/CAPTCHA requests were intercepted; no real email
was sent and no live account was created. Broad checks were not rerun per user
instruction. Existing login/marketing fixtures were adapted but not rerun here.

The user's earlier real six-digit OTP success is user-reported acceptance, not an
agent mail test. The separately confirmed disposable block and explicitly requested
test-account deletion are documented in TANPONY.md.

Password visibility follow-up: all four password fields share an eye toggle with
IT/EN show/hide labels and aria-pressed state. It switches input type without
changing the value or submitting. Mode changes and completed submissions re-mask
the fields. Submit selectors explicitly target type=submit so eye buttons cannot
be mistaken for Save password. A focused IT/EN mocked browser run passed toggling
all four fields and the existing confirmation/save flow. The first run exposed
the ambiguous old generic-button selector; it was corrected before the passing
rerun. No broad suite or real-email test was performed.
