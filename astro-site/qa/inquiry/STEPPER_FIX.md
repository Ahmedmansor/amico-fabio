# Cairo inquiry controls — 2026-11-02

Reproduced on the user's exact localhost:4321 development URL at 375/768px:
adult plus/minus remained at 3, child plus remained at 0, review stayed disabled.
The same actions worked on the built/deployed site. Browser inspection showed
504 Outdated Optimize Dep for the optimized vanilla-cookieconsent module. Its
static dependency through analytics/lead prevented inquiry.ts from executing.

The inquiry feature now starts optional analytics asynchronously, catches module
load failure, and initializes form controls independently. The existing consent-
gated sanitized generate_lead function still owns measurement; no personal fields
are added. WhatsApp handoff remains synchronous and never waits for analytics.
No prices, validation rules, defaults or submission destination changed.

Focused browser cases block consent/analytics: IT/EN at 375/1280px on both the
actual development URL and final static preview. Increment/decrement, adult min
1/child min 0, inline/dialog draft synchronization and local review passed (8
cases). No external lead was sent. Astro check: 590 files, 0 errors/warnings/hints.
Static build: 171 pages complete. The stale dev dependency itself is an existing
Vite cache issue; optional measurement failure no longer disables inquiry forms.
