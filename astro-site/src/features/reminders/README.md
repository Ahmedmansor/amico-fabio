# Wishlist reminder emails

The real customer flow is one optional reminder after 24 hours from the later
of consent and last actual addition. It reads saved correspondence language;
browsing switches never change it. Invalid/missing saved values fall back to
Italian. Templates and styles remain in this repository; Brevo delivers them.

The localhost-only QA button now mirrors that flow's actual reminder content,
saved language and no-login management links. It requires saved opt-in, accepts
no browser language/recipient/owner/content input and rechecks consent/language
before delivery. It does not wait 24 hours and does not consume/reset the real
automatic reminder allowance. Each approved language job is once-only in a
private durable QA ledger; a repeat explicitly reports that no new email was sent.
The previous page-language summary test and flag are retired.

Restricted services/Cron are deployed for the authorized test account only.
See ../../../qa/reminders/ACTIVATION.md and ../auth/SETUP.md for current evidence
and bounds. Public production release and Magic Link remain outside this scope.

Edit these files:
- `data/content/it.json` and `en.json`: subject lines and all visible copy.
- `presentation/wishlist-email.ts`: HTML structure and plain-text rendering.
- `presentation/email-styles.ts`: versioned inline email styles; no website CSS,
  Tailwind CDN, external fonts or UI framework is required by the message.
- `domain/email.ts`: pure selection of all available saved catalog items,
  localization, deduplication and unavailable-item reporting. No card cap.

The public static `/tours-manifest.json` is produced through catalog feature data
APIs. JPEG thumbnail crops are generated at build time; email clients do not need
object-fit to crop them. Prices/titles/URLs match the generated website, not
unpublished live catalog edits. Account data never belongs in this manifest.

## Generate and review on Windows PowerShell

Use the supported Node runtime and existing dependencies. From astro-site/:

```powershell
$env:PUBLIC_NOINDEX='1'
$env:PUBLIC_SITE_URL='http://127.0.0.1:4330'
npm run build -- --outDir .astro/email-catalog-test
Remove-Item Env:PUBLIC_NOINDEX
Remove-Item Env:PUBLIC_SITE_URL
node qa/reminders/preview.mjs --manifest .astro/email-catalog-test/tours-manifest.json
node scripts/serve-static-qa.mjs .astro/email-catalog-test 4330
```

Open http://127.0.0.1:4330/email-preview/ for four draft HTML messages and their
plain-text versions. Preview output lives in ignored .astro/; source and tests
are committed. Changing copy/styles only requires rerunning preview.mjs, not
fetching customer data. The generator refuses production/non-loopback manifests.
Four catalog examples demonstrate both sections; every supplied available item
is rendered, as requested by the user. This is not a real customer wishlist.
The preview generator makes no sending call; the separate backend Brevo transport
does. Previewing does not enroll a user or dispatch a message.

## Important execution boundaries

These previews do not enroll anyone or schedule mail. The preference service,
repository, Auth verifier and HTTP handler have a deployed Edge composition. Preference
storage was separately applied and role-tested on 2026-10-24, with zero records
after ROLLBACK. The protected preference endpoint is active; the website opt-in
remains disabled and real authenticated website saving remains unverified.
The main wishlist route can compose PreferenceBootstrap through a presentation
slot behind `PUBLIC_WISHLIST_REMINDER_OPT_IN_ENABLED=0`. This preserves the
acyclic feature graph; WishlistPage never imports reminder data/components.
The bridge reuses Auth's restored identity and reads consent once per account;
only an explicit Save writes. Native-page synthetic IT/EN browser checks passed.
Delivery/unsubscribe/final-wording review still precede live opt-in activation.
Local previews and evidence are in ../../../qa/reminders/PREFERENCES.md.
A reminder model requires an unsubscribe URL on the approved site
origin; the preview target only explains that no preference changed. A real
unsubscription handler, scoped tokens/headers and provider tests are still needed.
An email with no published saved items is not prepared. Missing catalog IDs are
returned separately so future orchestration cannot count them as delivered.

Before automatic reminder release: review final copy/business/footer details;
integrate the applied/tested consent storage; implement durable
event capture, queue/idempotency, quota limits and opt-out/bounce handling under
separately authorized backend scope. Future sender must resolve verified account
recipients server-side, enforce manifest environment/freshness rules and protect
Brevo secrets outside the static site. Local browser tests are not proof of
Gmail/Outlook inbox rendering, unsubscribe behavior or actual delivery.

## Approved schedule, not an active Cron job

One reminder, 24 hours after the later of consent activation and the latest real
addition. Duplicate saves, page visits and language changes do not postpone.
Emptying cancels; refilling before any send restarts. After provider acceptance,
no additional automatic reminder is allowed. Pure state transitions are tested
in domain/schedule.ts. A durable backend still needs to record every committed
addition/removal and acceptance: deriving last-addition time only from the
remaining rows would incorrectly move the clock back when the newest item is
removed. Never source this state from client timestamps or Analytics.
