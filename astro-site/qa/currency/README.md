# Fixed display currencies — 2026-11-02

The owner approved EUR as base, USD 1.12 and GBP 0.88 per EUR, with converted
amounts rounded up to whole units. These are fixed business settings, not live
market rates. Edit `src/features/currency/data/settings.ts`, review and rebuild
to update them. No new service, package, database table or runtime request.

The header disclosure sits next to language. Selection survives pages/reloads,
works without persistent storage and propagates across tabs. Main-site catalog,
wishlist, tour/package details, adult/child/addon prices, booking totals and
invoice previews share the same conversion. Currency does not change language,
recommendation order, EUR sorting or catalog data. Campaigns and reminder emails
retain their existing EUR behavior; trip-planner budget currency is a separate
customer input. Static HTML and structured reference prices remain EUR.

EUR keeps its original precision. Other currencies use ceil after removing
floating-point noise. Booking totals sum original EUR amounts first, then
convert once. Rounded unit prices may not sum to the rounded total; converted
amounts are explicitly indicative. Invoices show the reference EUR total and
WhatsApp retains its original EUR total plus the selected indicative total/code.
No production deployment or external booking submission was performed.

## Actual verification

Runtime: Node 24.21.0, the existing pinned external runtime.

```text
Vitest: 2 test files passed; 52 tests passed (currency + booking).
npx astro check: Result (617 files): 0 errors, 0 warnings, 0 hints.
npm run build: live Supabase validated 22 trips, 14 packages, 3 addons, 1 settings.
199 page(s) built; Complete!
Currency browser QA: 13 cases passed.
```

Browser matrix: IT/EN/ES/PT × 320/375/1280px; all marked prices, both conversions,
reload, price sorting, guest wishlist, tour/package details, changed traveler
counts, invoice and intercepted WhatsApp content. Additional cross-tab,
invalid saved preference and denied storage cases passed. All recorded page
errors were empty. Screenshots are local and ignored; `results.json` is evidence.
At narrow mobile widths the brand image remains, while brand text is hidden to
keep the language, currency and navigation controls within the viewport.

The first sandboxed check could not reach Supabase. Re-running with network
access passed. Existing Browserslist age notice remains. The first preview was
in a different execution context; the actual browser run used port 4334.

Run `browser.mjs` against a local built preview with `QA_ORIGIN`,
`PLAYWRIGHT_MODULE` (external bundled Playwright index.mjs) and `QA_BROWSER`
(installed Chrome). The script intercepts WhatsApp; no real request is sent.
UI reuses the existing native header disclosures and shared palette. The 21st
CLI was unavailable; no generated component or dependency was introduced.
