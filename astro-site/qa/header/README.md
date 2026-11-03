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

## Pending name shimmer

The reserved desktop name area now shows a small gold-tinted shimmer while
aria-busy=true. It is decorative and hidden from assistive technology; the
button retains its accessible name/busy state. Reduced motion leaves a static
placeholder. Mobile keeps the existing icon-only presentation.

Actual checks: Astro check (223 files): 0 errors, 0 warnings, 0 hints.
Build: validated live catalog; 94 pages built in 5.54s; Complete!
Header browser: 4 cases passed, including pending/ready shimmer, reduced motion,
unchanged navigation geometry, greeting/signout and asynchronous focus return.
An initial browser assertion checked focus before the dialog close event; it now
waits for focus restoration before asserting. No application focus logic changed.

## Coordinated avatar and favorites loading

The header now starts with a shared session-pending state only when Auth is
configured. Account avatar and name placeholders, plus the heart/count mask,
render from static HTML/CSS before the Auth module loads. Completing Auth
restoration clears the header mask for guests, restored users and handled
service failures. Wishlist persistence/count logic remains browser-local.

The account button uses the existing sanitized Google avatar URL from the Auth
profile adapter. Its image has explicit dimensions, a circular crop and
no-referrer policy. The avatar placeholder remains until image load/error;
missing or failed images reveal the existing neutral account icon. Signout
removes image src and restores that icon. Header and profile/dialog images share
load/error and render handling. No new profile cache or analytics fields exist.

All shimmers respect reduced motion. Mobile shows circular avatar/heart
placeholders; desktop also shows the existing reserved name placeholder.

Real verification:

```text
Header startup: 4 cases passed; avatar/name/favorites shimmer, delayed Google
avatar, image failure fallback, reduced motion, signout and stable layout.
Wishlist count: 4 language/viewport cases passed; add/remove, reload,
header-only page, cross-tab, clear, stable geometry and unavailable storage.
npx astro check
Result (224 files): 0 errors; 0 warnings; 0 hints
npm run build
Validated live Supabase: 22 trips, 14 packages, 3 addons, 1 settings.
94 page(s) built in 29.24s
Complete!
```

Avatar browser verification uses a synthetic session and intercepted image,
including delayed success and failed image loading. No real profile images or
personal values are committed. Screenshots are local and ignored. Build retains
the existing Browserslist age notice. No remote Auth/hosting changes occurred.
