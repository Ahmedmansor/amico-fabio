# Copilot instructions for Fabio Landing

Short, actionable guidance to make an AI coding agent productive in this codebase.

- **Big picture:** This is a small static landing site (no build system). Primary entry points:
  - [index.html](index.html) — main single-page lead capture form that posts to a Google Apps Script and then redirects to WhatsApp.
  - `sharm-secrets/` — a richer multi-section static site powered by `sharm-secrets/script.js` and locale files `i18n-it.js` / `i18n-en.js`.
  - `assets/` — images and catalogs used by both pages.

- **Why things are structured this way:** The project is intentionally zero-build (CDN deps + vanilla JS) so edits should preserve relative paths and avoid introducing bundlers unless requested.

- **Key patterns to follow (use concrete examples):**
  - i18n: locale objects are defined as `window.i18nIt` / `window.i18nEn` in `sharm-secrets/i18n-*.js`. `script.js` uses `data-i18n` attributes and `getValueByPath()` to map translations into DOM nodes. When adding copy, update these files.
  - Rendering: `renderComponent(containerId, dataPath, template)` mounts arrays/objects from the i18n JSON into DOM. See `universalTemplate()` and `checklistTemplate()` in `sharm-secrets/script.js` for examples.
  - Form flow: `index.html` form named `submit-to-google-sheet` posts to a Google Apps Script `scriptURL` and then redirects to WhatsApp using `fabioNumber` — change those values in `index.html` only if you control the endpoints.
  - Assets: image paths referenced in i18n use relative URLs like `../assets/secrets_catalogue/...` — keep path semantics when moving files.

- **External integrations & CDN dependencies:**
  - Tailwind via `https://cdn.tailwindcss.com` in `index.html`.
  - Google Fonts included in `index.html`.
  - `sharm-secrets/script.js` expects `Swiper` and `AOS` to be available when used (look for `new Swiper(...)` and `window.AOS`).
  - Google Apps Script endpoint used for form submissions (external network call).

- **Developer workflows:**
  - No build step: preview by opening `index.html` or serve with a local static server, e.g. `python -m http.server` or `npx serve .` from repo root.
  - Debug: use browser DevTools (Console + Network). To test the Google Apps Script endpoint safely, replace the `scriptURL` in `index.html` with a local stub or mock service.

- **Conventions & small rules:**
  - Keep vanilla JS modules single-file and avoid adding transpilers. If adding dependencies, prefer CDN includes to keep parity with current approach.
  - Use `data-i18n` keys for any text that needs translation; update both `i18n-it.js` and `i18n-en.js` together.
  - Prefer lazy loading images (`loading="lazy"`) as seen in `sharm-secrets/script.js` templates.

- **When changing behavior:**
  - If you change templates in `script.js`, verify `applyTranslations()` and `renderComponent()` still work and that `window.AOS.refreshHard()` is called if AOS is present.
  - If modifying the contact flow, double-check `submit-to-google-sheet` form name and `fabioNumber` redirect logic in `index.html`.

If anything is unclear or you'd like the file to include more examples (e.g., specific `data-i18n` keys to edit), tell me what to expand and I'll update this file.
