# Project Map and Control Files — Fabio Egypt

Inspection date: October 13, 2026. This file documents the local version before any changes to the site's functionality or design.

## 1. What is the site?

A tourism website that presents Fabio Egypt's trips and packages in Egypt, with program details, prices and add-ons, a Sharm Secrets guide, and a standalone marketing page showcasing Sharm. Booking prepares a message and opens WhatsApp. In the inspected source there is no payment system, no server that records bookings, and no user accounts.

The project is a multi-page HTML site, not a React or Vue app. Rendering and interaction happen in the browser using JavaScript and the DOM, with a mix of ES Modules and global objects on `window`. Pricing data comes from Google Sheets published as CSV; text and images come from separate local sources.

## 2. Technologies used

| Technology | Version pinned in the lock file | Role |
| --- | --- | --- |
| HTML, JavaScript, CSS | — | Pages, components, and interaction |
| Vite | 7.3.1 | Dev server and multi-page build |
| Tailwind CSS | 4.1.18 | Utility classes alongside custom CSS |
| PostCSS | 8.5.6 | CSS processing via `@tailwindcss/postcss` |
| Autoprefixer | 10.4.23 | Adds CSS vendor prefixes |
| gh-pages | 6.3.0 | Publishes the contents of `dist` |
| Google Sheets CSV | External service | Trips, prices, add-ons, packages, and promo settings |
| WhatsApp | External service | Receives booking requests and inquiries |
| Google Analytics 4 | Script inside the pages | Analytics; the Sharm offer form sends a `generate_lead` event |
| Vimeo | External player | Videos on the Sharm offer page |

Local fonts: Montserrat, Playfair Display, and Cinzel in WOFF2 format. Most images are WebP. There are no runtime libraries under `dependencies` in `package.json`; all tools are registered under `devDependencies`.

## 3. Pages and entry points

| Page | Function | Key control files |
| --- | --- | --- |
| `index.html` | Home page, destinations, intro to Fabio, reviews | `assets/js/main.js` and the hero, who-fabio, reviews, and promo modules |
| `explore.html?loc=...` | Browse and filter trips and packages by location | `explore-renderer.js` and `trips-renderer.js` |
| `details.html?id=...` | Trip details and booking | `details-renderer.js` and `booking-manager.js` |
| `package-details.html?id=...` | Package details, included trips, and booking | Files in `assets/js/features/packages/` and `booking-manager.js` |
| `sharm-secrets/index.html` | Sharm guide and tips | `assets/js/main.js` and the `secrets` section of the translations |
| `legal.html` | Legal and privacy content | `legal-renderer.js` and the `legal_page` section |
| `offerta-sharm/index.html` | Standalone marketing page for collecting travel requests | `src/landing-sharm/landing-sharm.js` and its components |
| `welcome.html` | Extra page present in the source | Not among the current build entries; uses Tailwind CDN and an external Google font |

Files referred to by short names such as `details-renderer.js` live inside `assets/js/modules/`.

`vite.config.js` defines seven pages to build. The pages load their files directly via `<script type="module">`; there is no central router. The file `src/main.js` imports CSS and sets `FABIO_BASE_URL`, but it is not the shared entry point for the current pages.

## 4. File and folder map

| Path | Responsible for |
| --- | --- |
| `package.json` / `package-lock.json` | Run commands, dependencies, and versions |
| `vite.config.js` | Page entries, `base: '/'`, the `__BASE` variable, and the `dist` folder |
| `postcss.config.js` | CSS processing plugins |
| `tailwind.config.js` | Color, font, and class settings; see the linking note below |
| `assets/css/style.css` | Global styling, fonts, and shared sections |
| `assets/lang/global-it.js` | Italian text and content |
| `assets/lang/global-en.js` | English text and content |
| `assets/js/main.js` | Global translation, home and Sharm guide initialization, and language events |
| `assets/js/core/api.js` | CSV URLs, parsing, ID normalization, and caching |
| `assets/js/image_paths.js` | Image map, path building, and location inference |
| `assets/js/trips_metadata.js` | Image counts for trip galleries |
| `assets/js/modules/global-header.js` | Header, navigation, and the language switcher menu |
| `assets/js/modules/global-footer.js` | Footer and contact links |
| `assets/js/modules/ui-layout.js` | Shared UI initialization and floating buttons |
| `assets/js/modules/booking-manager.js` | Traveler counts, add-ons, total calculation, and booking message |
| `assets/js/modules/promo-banner.js` | Shows the banner based on Google Sheets settings |
| `assets/js/modules/faq-loader.js` | Loads and translates the FAQ template |
| `assets/partials/faq-section.html` | Shared FAQ template |
| `assets/js/features/packages/` | Separation of service (data fetching), model (state), view (rendering), and controller (coordination) |
| `src/landing-sharm/landing-sharm.js` | Initialization order of the offer page components |
| `src/landing-sharm/landing-sharm.css` | Styling for the standalone offer page |
| `src/landing-sharm/components/` | Header, hero, destinations, steps, videos, FAQ, form, footer |
| `public/assets/` | Images and icons copied as-is into the build |
| `assets/fonts/` | Font files whose paths Vite processes |
| `public/CNAME` | The domain configured for deployment: `fabioegypt.com` |
| `dist/` | Build output; not a source for edits |
| `build/`, `.history/`, `.idea/`, `.vscode/`, `node_modules/` | Local folders excluded from Git; not approved page sources in the build configuration |

## 5. Data and booking flow

1. The HTML loads the image, translation, and page-specific module files.
2. `window.api.fetchAllData()` requests four CSV sheets: `Trips_Prices`, `Global_Settings`, `Trip_Addons`, and `Packages`.
3. The requests run in parallel with a five-second timeout. The CSVs are parsed, some trip IDs are normalized, and `included_trip_ids` in the packages are converted into a list.
4. The result is stored in `sessionStorage` under `fabio_trips_cache` and reused for the session, with no expiry defined in the code.
5. Components merge pricing data with translation content and images using `trip_id` or `package_id`.
6. `BookingManager` calculates the total in the browser and prepares a WhatsApp message. The offer page form is separate and collects the name, arrival date, and number of people to request a custom offer.

If one of the CSV requests fails, the current path falls back to the cache or to empty lists. The log message says "Dummy Data", but there is no actual dummy data in the final fallback value. The current contents of the Google Sheets and the availability of the service were not tested in this inspection.

## 6. Translation files and how they work

The two existing languages are Italian `it` and English `en`, with Italian as the default. There is currently no Arabic dictionary.

The two files define `window.i18nIt` and `window.i18nEn`. The matching top-level sections are:

`menu`, `reviews`, `faq`, `fab`, `hero`, `global`, `explore`, `secrets`, `footer`, `legal_page`, `packages`, `trips`.

Both dictionaries were run in a Node context with limited browser simulation: each language has 2002 final value paths, 27 trip keys, and 14 package keys. No keys are missing when comparing the structure in both directions. This is a structural comparison; it does not prove the quality of the wording or that every visible text is translated.

The engine in `assets/js/main.js` reads `data-i18n="global.some_key"` and then uses `textContent`. There is also `data-img` for accessing paths from the dictionary and `data-landing-img` for accessing `ImagePaths`. Some sections are rendered directly from translation lists/objects, and some details use `innerHTML` to display formatted text.

The language is stored primarily in `localStorage.fabio_lang` and copied to `preferredLanguage`. Changing the language updates `document.documentElement.lang` and fires a `langChanged` event that several components listen to. Some pages rely on their own header and module initialization and do not load `main.js`, so check the page's own path when changing translations.

The `offerta-sharm` page is different: the Italian text is written directly inside its components, and it does not load the dictionaries or the global language-switching engine. Editing `global-en.js` alone will not translate it.

### When editing content later

- Shared text or a trip description: update both dictionaries with the same keys, keeping trip and package IDs intact.
- A price, add-on, or enabling an offer: check the appropriate Google Sheets sheet, the field mapping in `api.js`, and the consuming component.
- A trip image: check the file in `public/assets/images/`, the `image_paths.js` map, and the image counts in `trips_metadata.js`.
- Sharm offer page text: edit the corresponding component inside `src/landing-sharm/components/`.
- A WhatsApp number or social link: search for all occurrences; these values are spread across more than one component and are not a single central setting.

## 7. Inspection results and notes before editing

| Note | Evidence and impact |
| --- | --- |
| The build succeeded | `npm run build` finished with exit code 0 and produced the seven pages |
| Node version warning | The environment uses 20.15.0; Vite's message asks for 20.19+ or 22.12+ even though this build succeeded |
| Background image warnings | The build did not resolve `../bg.jpeg`, `../bg-mobile.jpg`, and six `secrets-bg` images; the paths were left to be handled at runtime. They must be checked in the browser, since a successful build does not prove they display |
| Language key mismatch for the banner | `promo-banner.js` reads `localStorage.lang` while the current system writes `fabio_lang` and `preferredLanguage`; the banner may appear in a different language |
| Tailwind config linkage not visible | `style.css` imports `tailwindcss` and has no `@config` linking `tailwind.config.js`; do not assume the file's customizations are active without checking the generated CSS |
| Service Worker and cache removal | `main.js` unregisters registrations and clears Cache Storage; the first call to `navigator.serviceWorker` is not guarded by an existence check, and then there is another guarded call |
| Pages and files outside the active path | `welcome.html` is not part of the build, and `ReviewsContainer.js` is not imported in the offer page initializer; a file existing does not mean it is used |
| Catalog data depends on the network | There is no complete local fallback for prices when the CSV fails, and the cache may keep stale values for the whole session |
| Outdated browser compatibility data | The build showed a Browserslist warning; no dependencies were updated during the inspection |
| No test or lint commands | `package.json` provides only dev/build/preview/deploy |

These notes were not fixed; the purpose is to record the current state before agreeing on changes. No visual inspection, browser interaction, performance measurement, or verification of the deployed site was performed, and no booking request was sent and no deployment was executed.

## 8. Running and verifying later

```sh
npm ci
npm run dev
npm run build
npm run preview
```

`npm ci` sets up dependencies when needed; it was not necessary during this inspection. Use a Node version compatible with the warning mentioned above. `npm run deploy` runs the build via `predeploy` and then publishes `dist` using gh-pages; the existence of the command and the CNAME shows the deployment setup but does not prove the state of the live hosting.

Suggested browser check before any release: the seven pages on mobile and desktop, switching between Italian/English, trip filtering, trip and package details, images, price with add-ons, behavior when data fails, and the wording of the WhatsApp message without sending it.

The only change resulting from this inspection is this reference file in the sources; the local `dist/` folder, which is excluded from Git, was also regenerated by the build test.