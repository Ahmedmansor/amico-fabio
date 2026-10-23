# Account control startup and greeting

The header account control is independent of navigation links, at the left edge.
It renders a disabled icon in static HTML while Auth initializes. Its desktop
text area has a fixed width; mobile uses the icon with an accessible label.
Once ready, a guest sees the existing Sign in/Accedi label; an authenticated
user sees Hi/Ciao and the first whitespace-delimited part of their display name.
Missing names use the existing account label. Text is inserted via textContent.
Long names are clipped visually with ellipsis and retain the accessible label.
No names are saved in new storage, analytics, build output or QA artifacts.

Montserrat 700 is preloaded to reduce header font swapping. Header controls stay
visible while Auth initializes, and session state changes do not change their
allocated width. Closing the dialog returns focus to the account button.

Browser verification on 2026-10-23:

`node qa/header/browser.mjs`
Header startup: 4 cases passed; immediate icon, localized greeting, stable
navigation, left placement, signout and focus restoration.

The script delays Auth initialization and substitutes a synthetic profile/service.
Italian/English at 375/1440 widths verify initial visibility, disabled pending
state, greeting, unchanged button/navigation geometry, no horizontal overflow,
signout text and dialog keyboard focus. No real account or external Auth writes
are involved. Screenshots are ignored. Results are in browser-results.json.

Run against Astro dev with the approved local Auth configuration enabled.
PLAYWRIGHT_MODULE points to an external Playwright index.mjs; QA_BROWSER points
to the browser executable; QA_ORIGIN defaults to http://127.0.0.1:4322.

Initial diagnosis measured ~60px navigation movement caused by inserting a
previously hidden Auth control. Reserving its width alone fixed movement but
still revealed the control late. The final behavior renders the icon immediately
and personalizes its reserved label space after session restoration.

Required final checks (real output):

```text
npx astro check
Result (223 files):
- 0 errors
- 0 warnings
- 0 hints

npm run build
Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings.
[build] 94 page(s) built in 20.30s
[build] Complete!
```

The build retains the existing Browserslist database age warning. It required
network access for catalog SELECT; no remote configuration or data was changed.
The existing Auth browser suite's menu/focus assumptions were updated for the
independent header control; that full email/callback suite was not rerun here.
