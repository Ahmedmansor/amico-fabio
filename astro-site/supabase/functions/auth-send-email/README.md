# Auth email hook — disabled local proposal

The HTTP hook replaces SMTP; it does not run before SMTP. Only signed `signup`
and `magiclink` events are supported. Invite/recovery/email-change events fail
closed; do not activate if those flows are required without implementing their
separate templates and contracts. Google and reminders are unchanged.

## Implemented locally

- Standard Webhooks HMAC-SHA256 verification over exact raw bytes, timestamp
  tolerance 300 seconds, bounded bodies, verification before parsing/DNS/RPC.
  `SEND_EMAIL_HOOK_SECRET` must be the hook signing secret (`v1,whsec_...`), not a
  project/API key. Rotation is supported by the handler's secret array.
- Exact approved `allowedOrigins` and localized `/it|en/auth/callback/` routes.
  Tokens go in `#token_hash=...&type=email`, parsed by the existing explicit
  Continue / `verifyOtp` callback. No PKCE verifier from the requesting browser
  is required for this email flow. Google keeps its separate PKCE flow.
- Language comes from the validated callback route, not old user metadata.
- Syntax/local disposable check, real MX/A/AAAA lookup, then the maintained SQL
  disposable catalog inside the atomic reservation RPC (including existing users).
- Durable hash-only delivery ledger, request-attempt matching, atomic global
  hourly + UTC-day limits, recipient cooldown/hourly limits. Denied attempts do
  not increment quota. Reservations count attempted provider sends conservatively,
  including rejected/uncertain sends, and commit before contacting Brevo.
- Success requires Brevo 201, a bounded nonempty messageId, and durable settlement.
  Accepted replays return 200 without sending. In-flight/crashed/unknown outcomes
  stay quarantined indefinitely; an expired lease never causes an automatic resend.
  Only an explicit 429 is retryable after cooldown and a new atomic reservation.
- Fetch/body deadlines: HTTP body 500ms, DNS each query 500ms (MX then parallel
  A/AAAA), RPC each 600ms, provider fetch+body <=1500ms. These leave margin within
  Supabase's five-second HTTP-hook contract; actual deployed latency/cold starts
  must be measured before activation. Timeouts never expose provider diagnostics.

## Configuration and activation gates

`configuration.json` stays `enabled:false`. `limits.daily:null` deliberately
prevents activation until the shared Brevo budget is allocated. Hourly 30,
perEmail 5 and cooldownSeconds 60 are local proposals, not applied settings.
Choose daily Auth capacity accounting for reminders, SMTP, campaigns and all other
Brevo usage; this ledger only counts this hook. A UTC-day Auth limit is not a
provider-wide quota guarantee. Align the reset boundary with the approved budget.
Sync the browser resend interval with the chosen backend cooldown.

1. Review the SQL and rollback role tests in `../../auth-protection/`. Native SQL
   execution and concurrent-session evidence are required under separate approval.
2. Run native `deno check --config deno.json index.mjs` and a signed local HTTP
   smoke test; Node tests cannot prove Deno packaging or deployed permissions.
3. Review the exact test origin and Supabase redirect allowlist. No production
   fallback is configured. Approve provider/hook changes and recipient test scope.
4. Provision runtime secrets through approved secret management without printing
   them. The entry reads Supabase runtime backend credentials, Brevo API key and
   `SEND_EMAIL_HOOK_SECRET`; no secret belongs in configuration/source/commits.
5. Only after approval deploy with `supabase functions deploy auth-send-email
   --no-verify-jwt`. JWT gateway checking is replaced by mandatory internal HMAC
   checking; a public publishable key must never authorize this hook.
6. Perform real new/existing user and different-browser inbox tests, used/expired
   links, direct OTP endpoint abuse tests, quota and timeout/replay tests. Enable
   email UI only after these pass. Actual delivery is not proven by provider 201.

## Uncertain delivery recovery

Inspect the ledger and provider evidence administratively under explicit data
access/write authorization, using hashes/messageId rather than logging tokens.
If accepted, reconcile the recorded attempt to accepted. If absence is proven,
authorized recovery may release it for a new guarded attempt. Never change unknown
to retryable based only on elapsed time. The user may request a new sign-in link
subject to normal quotas; accepted old events are retained for replay protection.
Define cleanup/retention before activation; do not delete unresolved ledger rows.

References: [Supabase Send Email Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook),
[hook deadlines](https://supabase.com/docs/guides/auth/auth-hooks),
[Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md).
