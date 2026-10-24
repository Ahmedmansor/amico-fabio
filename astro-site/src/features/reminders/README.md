# Wishlist emails — repository templates and restricted Brevo test

The email source stays in this repository. Brevo delivers rendered HTML/plain
text through the restricted test service; no dashboard-only template is required.
The user confirmed the actual favorites summary and the updated WhatsApp booking
actions. Automatic reminders are not active. Current operational evidence is in
[BREVO.md](../../../qa/reminders/BREVO.md) and [SETUP.md](../auth/SETUP.md).
The approved, pending locale/request contract is in
[PLAN.md section 6.1](../auth/PLAN.md#61-approved-language-and-request-contract--2026-10-24).
IT/EN templates exist; the current restricted test job fixes English, so changing
the website language does not yet change that email.

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
is not mounted and real authenticated website saving remains unverified.
The draft ReminderPreferences.astro component, binder and IT/EN wording are
prepared for isolated review. They are not imported by WishlistPage. Local
preview steps and browser checks are in ../../../qa/reminders/README.md.
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
