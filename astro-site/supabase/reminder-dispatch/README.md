# Complete reminder pipeline — prepared source, activation pending

Static Astro remains unchanged as an architecture. The worker is a separate
authenticated Supabase Edge service with a private Postgres queue; no Astro API
route, SSR or application server is added. No new dependency is installed.

## Policy and failure behavior

- Due selection joins consent + durable activity in one bounded batch query.
  Delay is fixed at 24 hours after the later of consent and last actual addition.
  No browser clock or arbitrary HTTP delay/recipient/account overrides exist.
- One permanent job per account; first accepted mail consumes it. Adding/removing
  items, changing language or re-enabling consent cannot create a second job.
- Per-attempt lease fences all preparation. Expired preparation can be reclaimed;
  expired sending is quarantined as unknown, never automatically resent.
- Content/recipient/link are sealed privately before any provider HTTP. Stable
  identity and identical payload survive a definitive 429. Newer consent/activity/
  language invalidates preparation before first attempt; after an attempted send
  it fails closed rather than silently changing a message under its old identity.
- SQL rechecks eligibility and consumes a separate reviewed daily reminder attempt
  budget immediately before sending. Auth mail capacity is not treated as spare.
- Provider timeout/5xx/malformed response/duplicate acknowledgement never creates
  a fresh job. Late verified callbacks can reconcile acceptance; unknown outcomes
  without provider confirmation need operator review, not a resend button.
- Delivered is separate from accepted. Hard bounce, complaint, block and provider
  unsubscribe suppress further mail. Callback identity comes from the immutable
  job header, never from supplied recipient/user metadata. Replayed callbacks are
  idempotent. Provider withdrawal does not fabricate consent-text evidence.
- Accepted payload is cleared to minimize stored recipient/content/link data.
  Remaining unknown/retry payload retention and cleanup are launch decisions.
- Withdrawal/account deletion can race with an HTTP send already admitted. The
  final recheck prevents later attempts; it cannot retract provider-accepted mail.

## Restricted QA is separate

`qa-ledger.sql` stores only QA identity/status/message ID. It does not consume the
real reminder allowance. Each approved IT/EN test has its own fixed job ID; a
durable ledger prevents repeat HTTP even beyond Brevo's provider deduplication
lifetime. Old non-durable jobs retain their short-window rule. No general
customer-facing immediate-send feature is introduced.

## Explicit activation order (not yet executed)

1. Review/apply activity capture (`../reminder-activity/schema.sql`); it refuses
   existing active consent because missing removed-item history cannot be guessed.
2. Apply `cron-auth.sql`, `schema.sql`, `provider-events.sql`, `qa-ledger.sql`.
   No schedule or sending is created by those files.
3. Run approved activity and dispatch rollback fixtures. Dispatch fixtures scope
   claims only to their disposable account and refuse existing operational state.
   Native concurrency/locks/timeouts require verification before public release.
4. Approve restricted account/recipient allowlists, daily budget, management-token
   lifetime and management ingress settings. Configure/deploy management and worker.
5. Deploy updated static test pages so email management links have an HTTPS target.
   Production GitHub Pages/main/domain remain unchanged. Google on a preview host
   needs separately reviewed browser config/redirect setup if activated there.
6. Separately approve/run `cron.sql`: generates a scoped token inside Postgres,
   stores it in Vault and keeps only its hash for verification. It bootstraps only
   this fixed Brevo callback and schedules 15-minute checks. No backend key is put
   in SQL source, browser, Cron text or returned to the agent.
7. The worker cannot send until the authenticated bootstrap has confirmed the
   fixed callback configuration. Bootstrap requires the same scoped worker token;
   it cannot configure arbitrary URLs/events. Provider settings need approval.
8. Renew approved bilingual QA jobs/window and deploy its authenticated test
   function, then enable page-locale QA locally. Actual email tests are user clicks.

Callback secret is derived with HMAC from the existing server-only backend binding
and a distinct purpose string, never from user metadata. Key rotation requires
re-running callback bootstrap. No extra secret is requested in chat.

References checked: [Brevo callback authentication](https://developers.brevo.com/docs/secured-webhooks),
[transactional events](https://developers.brevo.com/docs/transactional-webhooks).
The management page uses explicit confirmation, not claimed RFC 8058 one-click
support. Inspect actual provider headers/fragment handling before public release.
