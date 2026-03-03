# PROJECT ANALYSIS: Monolithic to Modular Clean Architecture Refactoring

**Project:** Fabio Landing (Vite-based)  
**Analysis Date:** February 2026  
**Current State:** Monolithic architecture with 4000+ line CSS file and mixed data/logic JS files  
**Target State:** Modular Clean Architecture with Vite bundling

---

## Executive Summary

This project currently uses a **monolithic architecture** where:
- A single 4,319-line CSS file contains all styles
- JavaScript files mix data objects with rendering logic
- Multiple modules use direct DOM manipulation (`innerHTML`)
- Language data is embedded in global objects

**Refactoring Goals:**
1. Split CSS into logical, maintainable modules
2. Separate data from logic in JavaScript
3. Leverage Vite's native ES Module support and bundling
4. Prepare codebase for future SSG (Static Site Generation) compatibility

---

## 1. CSS REFACTORING STRATEGY (Vite-Friendly)

### 1.1 Current State Analysis

**File:** `assets/css/style.css` (4,319 lines)

**Identified Sections:**
1. **Fonts** (Lines 1-103): Montserrat, Playfair Display, Cinzel font-faces
2. **Global Header** (Lines 107-418): Fixed header, navigation, language switcher
3. **Hero Slider** (Lines 420-603): Mobile-first hero banner with desktop adaptations
4. **Catalog Cards** (Lines 605-1050): Trip cards, badges, pricing, animations
5. **CSS Variables** (Lines 1125-1144): Design tokens for colors, shadows, radii
6. **Location Entry Cards** (Lines 1147-1341): Full-width luxury entry cards
7. **Who Fabio Section** (Lines 1362-1659): Parallax bio section with modal
8. **Floating Widgets** (Lines 1660-1874): WhatsApp, navigation FABs
9. **Global Footer** (Lines 1910-2117): Footer with social links
10. **Welcome Page** (Lines 2119-2165): Landing page specific styles
11. **Legal Page** (Lines 2167-2450): Privacy/terms page layout
12. **Package Details** (Lines 2451-2555): Trip details page styles
13. **Sharm Secrets** (Lines 2556-3680): Full section-based page styles
14. **Promo Banner** (Lines 3682-3750): Fixed promotional banner
15. **Details Page Specifics** (Lines 3751-4075): Gallery, FAQ, animations
16. **Reviews Section** (Lines 4076-4318): Testimonials carousel

### 1.2 Proposed Directory Structure

```
assets/css/
├── main.css                    # Entry point (imports all modules)
├── base/
│   ├── _reset.css             # Normalize/reset
│   ├── _fonts.css             # @font-face declarations
│   ├── _variables.css         # CSS custom properties
│   └── _typography.css        # Base typography rules
├── components/
│   ├── _buttons.css           # Button styles
│   ├── _cards.css             # Catalog cards, trip cards
│   ├── _badges.css            # Deal badges, ribbons
│   ├── _forms.css             # Input fields, booking forms
│   ├── _modals.css            # Modal/overlay components
│   └── _animations.css        # Keyframes, transitions
├── layout/
│   ├── _header.css            # Global header
│   ├── _footer.css            # Global footer
│   ├── _hero.css              # Hero slider section
│   ├── _grid.css              # Grid layouts
│   └── _floating-widgets.css  # FAB buttons
├── pages/
│   ├── _home.css              # Index page specific
│   ├── _explore.css           # Explore/trips catalog
│   ├── _details.css           # Trip details page
│   ├── _legal.css             # Legal/privacy page
│   ├── _secrets.css           # Sharm Secrets page
│   └── _welcome.css           # Welcome page
├── sections/
│   ├── _who-fabio.css         # Who Fabio parallax section
│   ├── _reviews.css           # Reviews carousel
│   ├── _location-entry.css    # Location entry cards
│   └── _promo-banner.css      # Promotional banner
└── utilities/
    ├── _helpers.css           # Utility classes
    └── _responsive.css        # Media query mixins
```

### 1.3 Implementation Strategy with Vite

**Step 1: Create Entry Point**
```css
/* assets/css/main.css */
@import "tailwindcss";

/* Base */
@import "./base/_fonts.css";
@import "./base/_variables.css";
@import "./base/_typography.css";

/* Layout */
@import "./layout/_header.css";
@import "./layout/_footer.css";
@import "./layout/_hero.css";
@import "./layout/_floating-widgets.css";

/* Components */
@import "./components/_cards.css";
@import "./components/_badges.css";
@import "./components/_buttons.css";
@import "./components/_modals.css";
@import "./components/_animations.css";

/* Sections */
@import "./sections/_who-fabio.css";
@import "./sections/_reviews.css";
@import "./sections/_location-entry.css";
@import "./sections/_promo-banner.css";

/* Pages */
@import "./pages/_home.css";
@import "./pages/_explore.css";
@import "./pages/_details.css";
@import "./pages/_legal.css";
@import "./pages/_secrets.css";

/* Utilities */
@import "./utilities/_helpers.css";
```

**Step 2: Update HTML References**
```html
<!-- Before -->
<link rel="stylesheet" href="assets/css/style.css">

<!-- After -->
<link rel="stylesheet" href="assets/css/main.css">
```

**Step 3: Vite Configuration**
No changes needed! Vite automatically:
- Resolves `@import` statements
- Bundles all CSS into a single optimized file
- Minifies and tree-shakes unused styles
- Generates source maps for debugging

**Benefits:**
- ✅ **Maintainability**: Each file has a single responsibility
- ✅ **Scalability**: Easy to add new components/pages
- ✅ **Debugging**: Smaller files are easier to navigate
- ✅ **Performance**: Vite optimizes the final bundle
- ✅ **Team Collaboration**: Multiple developers can work on different files

---

## 2. JAVASCRIPT REFACTORING STRATEGY

### 2.1 Current State Analysis

**Data Files (Should be Pure Data):**
- `assets/js/image_paths.js` (290 lines) - ⚠️ Mixed: Data + Logic + DOM binding
- `assets/js/trips_metadata.js` (38 lines) - ✅ Pure data
- `assets/lang/global-en.js` (2,039 lines) - ✅ Pure data
- `assets/lang/global-it.js` - ✅ Pure data

**Logic Files (Should be Pure Functions):**
- `assets/js/main.js` (583 lines) - ⚠️ Mixed: Orchestration + Templates + DOM
- `assets/js/core/api.js` (207 lines) - ✅ Good separation (data fetching)
- `assets/js/modules/*.js` (13 files) - ⚠️ Mixed: Logic + DOM + Templates

**Key Issues:**
1. **Data/Logic Coupling**: `image_paths.js` contains data + helper functions + DOM binding
2. **Template Mixing**: `main.js` contains HTML template functions
3. **Direct DOM Manipulation**: 74 instances of `innerHTML =` across 14 files
4. **Event Listeners**: 126 instances of DOM event binding

### 2.2 Proposed Modular Structure

```
assets/js/
├── main.js                     # Entry point (orchestration only)
├── config/
│   ├── constants.js           # App-wide constants
│   └── routes.js              # Route definitions
├── data/
│   ├── image-paths.json       # Pure image path data
│   ├── trips-metadata.json    # Trip image counts
│   └── i18n/
│       ├── en.json            # English translations
│       └── it.json            # Italian translations
├── services/
│   ├── api.service.js         # Data fetching (existing core/api.js)
│   ├── image.service.js       # Image path resolution logic
│   ├── i18n.service.js        # Translation engine
│   └── storage.service.js     # LocalStorage/SessionStorage wrapper
├── models/
│   ├── Trip.model.js          # Trip data structure
│   ├── Package.model.js       # Package data structure
│   └── Review.model.js        # Review data structure
├── views/
│   ├── templates/
│   │   ├── card.template.js   # HTML template functions
│   │   ├── modal.template.js
│   │   └── header.template.js
│   └── renderers/
│       ├── trips.renderer.js  # Trip catalog rendering
│       ├── details.renderer.js
│       └── reviews.renderer.js
├── controllers/
│   ├── app.controller.js      # Main app orchestration
│   ├── trips.controller.js    # Trip catalog logic
│   └── booking.controller.js  # Booking flow logic
├── utils/
│   ├── dom.utils.js           # DOM helper functions
│   ├── string.utils.js        # String manipulation
│   └── validation.utils.js    # Form validation
└── features/
    ├── header/
    │   ├── header.controller.js
    │   ├── header.view.js
    │   └── header.service.js
    └── packages/                # ✅ Already following this pattern!
        ├── packages.controller.js
        ├── packages.model.js
        ├── packages.service.js
        └── packages.view.js
```

### 2.3 Data vs Logic Separation Examples

#### Example 1: Image Paths Refactoring

**Before (image_paths.js - Mixed):**
```javascript
const ImagePaths = {
  ui: {
    placeholder: p('assets/images/ui/placeholder.webp'),
    headerLogo: p('assets/images/logo/fabio-header-logo.webp'),
  },
  getPoster(location, category, tripId) { /* logic */ },
  resolveTripContext(trip) { /* logic */ }
};
```

**After (Separated):**

```javascript
// data/image-paths.json (Pure Data)
{
  "ui": {
    "placeholder": "assets/images/ui/placeholder.webp",
    "headerLogo": "assets/images/logo/fabio-header-logo.webp"
  },
  "landing": {
    "hero": [
      "assets/images/comandamenti-images/1.webp",
      "assets/images/comandamenti-images/2.webp"
    ]
  }
}

// services/image.service.js (Pure Logic)
import imagePaths from '../data/image-paths.json';

export class ImageService {
  static getBasePath() {
    return window.location.pathname.includes('/sharm-secrets/') ? '../' : '/';
  }

  static resolve(path) {
    return this.getBasePath() + path;
  }

  static getPoster(location, category, tripId) {
    const folder = `assets/images/trips/${location}/${category}/${tripId}/`;
    return this.resolve(folder + 'poster.webp');
  }

  static getUIImage(key) {
    return this.resolve(imagePaths.ui[key]);
  }
}
```

#### Example 2: i18n Refactoring

**Before (global-en.js - Mixed):**
```javascript
window.i18nEn = {
  menu: { home: "Home", trips: "Trips" },
  reviews: { items: [/* 2000 lines of review data */] }
};
```

**After (Separated):**

```javascript
// data/i18n/en.json (Pure Data)
{
  "menu": {
    "home": "Home",
    "trips": "Trips"
  },
  "reviews": {
    "title": "Guest Reviews"
  }
}

// data/reviews/en.json (Separate large datasets)
{
  "items": [
    { "name": "John Doe", "text": "Great!", "rating": 5 }
  ]
}

// services/i18n.service.js (Pure Logic)
export class I18nService {
  static currentLang = 'it';
  static translations = {};

  static async loadLanguage(lang) {
    const [common, reviews] = await Promise.all([
      import(`../data/i18n/${lang}.json`),
      import(`../data/reviews/${lang}.json`)
    ]);
    
    this.translations = { ...common.default, reviews: reviews.default };
    this.currentLang = lang;
    return this.translations;
  }

  static translate(key) {
    const keys = key.split('.');
    let value = this.translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  }
}
```

### 2.4 Vite Integration Benefits

**ES Modules (Native Support):**
```javascript
// main.js
import { ImageService } from './services/image.service.js';
import { I18nService } from './services/i18n.service.js';
import { TripsController } from './controllers/trips.controller.js';

// Vite automatically bundles and tree-shakes
```

**JSON Imports:**
```javascript
import imagePaths from './data/image-paths.json';
// Vite handles JSON imports natively
```

**Code Splitting:**
```javascript
// Lazy load heavy features
const PackagesController = await import('./features/packages/packages.controller.js');
```

---

## 3. DEPENDENCY GRAPH & COUPLING ANALYSIS

### 3.1 Current Dependencies

```
main.js
├── Depends on: window.i18nIt, window.i18nEn (global)
├── Depends on: window.ImagePaths (global)
├── Depends on: window.api (global)
├── Depends on: window.PromoBanner (global)
├── Depends on: window.UILayout (global)
└── Depends on: window.TripsMetadata (global)

modules/global-header.js
├── Depends on: window.i18nIt, window.i18nEn
├── Depends on: window.ImagePaths
└── Depends on: window.applyTranslations (from main.js)

modules/trips-renderer.js
├── Depends on: window.ImagePaths
├── Depends on: window.appData (set by main.js)
└── Depends on: DOM (#trips-grid)

modules/details-renderer.js
├── Depends on: window.ImagePaths
├── Depends on: window.api
├── Depends on: window.appData
└── Heavy DOM manipulation (16 innerHTML instances)
```

### 3.2 Coupling Issues

**Global Variable Pollution:**
- 10+ global objects (`window.i18nEn`, `window.ImagePaths`, etc.)
- Risk of naming conflicts
- Hard to track dependencies

**Tight Coupling:**
- `main.js` directly calls module functions
- Modules depend on globals set by other modules
- Circular dependencies possible

**DOM Coupling:**
- 74 instances of `innerHTML =` (direct DOM manipulation)
- Hard-coded element IDs throughout codebase
- Difficult to test without a browser

### 3.3 Proposed Dependency Injection

```javascript
// controllers/app.controller.js
export class AppController {
  constructor(services) {
    this.api = services.api;
    this.i18n = services.i18n;
    this.image = services.image;
  }

  async init() {
    const lang = await this.i18n.loadLanguage('it');
    const data = await this.api.fetchAllData();
    // No globals needed!
  }
}

// main.js (Clean orchestration)
import { AppController } from './controllers/app.controller.js';
import { ApiService } from './services/api.service.js';
import { I18nService } from './services/i18n.service.js';
import { ImageService } from './services/image.service.js';

const app = new AppController({
  api: ApiService,
  i18n: I18nService,
  image: ImageService
});

app.init();
```

---

## 4. SSG PREPARATION ANALYSIS

### 4.1 SSG-Incompatible Patterns Found

**✅ Good News: No `document.write` found!**

**⚠️ Issues to Address:**

#### 4.1.1 Direct DOM Manipulation (74 instances)
```javascript
// Current pattern (SSG-incompatible)
container.innerHTML = `<div>${data}</div>`;

// SSG-friendly alternative
function renderToString(data) {
  return `<div>${data}</div>`;
}
// Can be pre-rendered at build time
```

**Files with heavy `innerHTML` usage:**
- `packages.view.js` (18 instances)
- `details-renderer.js` (16 instances)
- `explore-renderer.js` (7 instances)
- `trips-renderer.js` (6 instances)

#### 4.1.2 Runtime DOM Queries (126 instances)
```javascript
// Current pattern
document.querySelector('#trips-grid').innerHTML = html;

// SSG-friendly alternative
export function renderTripsGrid(data) {
  return `<div id="trips-grid">${generateHTML(data)}</div>`;
}
```

#### 4.1.3 Event Listeners (126 instances)
```javascript
// Current pattern (runtime only)
document.addEventListener('DOMContentLoaded', () => {
  // Initialize app
});

// SSG-friendly alternative (hydration)
// 1. Pre-render HTML at build time
// 2. Attach event listeners after hydration
export function hydrate() {
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', handleClick);
  });
}
```

#### 4.1.4 Dynamic Data Fetching
```javascript
// Current pattern (runtime API calls)
const data = await window.api.fetchAllData();

// SSG-friendly alternative
// 1. Fetch data at build time
// 2. Generate static HTML
// 3. Optionally hydrate with fresh data client-side
```

### 4.2 SSG Migration Strategy

**Phase 1: Separate Rendering from Side Effects**
```javascript
// Before (mixed)
function renderTrips() {
  const container = document.getElementById('trips-grid');
  const data = await fetchData(); // Side effect
  container.innerHTML = generateHTML(data); // Side effect
}

// After (pure rendering)
export function generateTripsHTML(data) {
  return data.map(trip => `
    <div class="trip-card">${trip.title}</div>
  `).join('');
}

// Side effects isolated
export function mountTrips(container, data) {
  container.innerHTML = generateTripsHTML(data);
}
```

**Phase 2: Build-Time Data Fetching**
```javascript
// build/generate-static.js (Node.js script)
import { fetchAllData } from '../assets/js/services/api.service.js';
import { generateTripsHTML } from '../assets/js/views/templates/trips.template.js';

const data = await fetchAllData();
const html = generateTripsHTML(data);

// Write to static HTML file
fs.writeFileSync('dist/trips.html', html);
```

**Phase 3: Progressive Enhancement**
```html
<!-- Static HTML (works without JS) -->
<div id="trips-grid">
  <!-- Pre-rendered content -->
</div>

<script type="module">
  // Optional: Hydrate with fresh data
  import { hydrate } from './js/main.js';
  hydrate();
</script>
```

### 4.3 SSG-Friendly Checklist

- [ ] **Separate pure functions from side effects**
- [ ] **Extract HTML templates to pure functions**
- [ ] **Move data fetching to build-time scripts**
- [ ] **Use data attributes for event delegation**
- [ ] **Implement hydration strategy**
- [ ] **Test with JS disabled (progressive enhancement)**

---

## 5. MIGRATION ROADMAP

### Phase 1: CSS Refactoring (Week 1-2)
**Priority: High | Risk: Low**

1. **Create directory structure**
   ```bash
   mkdir -p assets/css/{base,components,layout,pages,sections,utilities}
   ```

2. **Extract base styles**
   - Move fonts to `base/_fonts.css`
   - Move variables to `base/_variables.css`
   - Move typography to `base/_typography.css`

3. **Extract layout components**
   - Move header to `layout/_header.css`
   - Move footer to `layout/_footer.css`
   - Move hero to `layout/_hero.css`

4. **Extract UI components**
   - Move cards to `components/_cards.css`
   - Move buttons to `components/_buttons.css`
   - Move modals to `components/_modals.css`

5. **Create main.css entry point**
   - Import all modules in logical order
   - Update HTML references

6. **Test thoroughly**
   - Visual regression testing
   - Cross-browser testing
   - Mobile responsiveness

**Success Criteria:**
- ✅ All pages render identically
- ✅ No CSS errors in console
- ✅ Vite builds successfully
- ✅ Bundle size similar or smaller

### Phase 2: Data Extraction (Week 3)
**Priority: High | Risk: Low**

1. **Convert JS data to JSON**
   ```bash
   # Create data directory
   mkdir -p assets/js/data/{i18n,reviews}
   ```

2. **Extract image paths**
   - Convert `image_paths.js` data to `image-paths.json`
   - Keep logic in `services/image.service.js`

3. **Extract i18n data**
   - Convert `global-en.js` to `i18n/en.json`
   - Convert `global-it.js` to `i18n/it.json`
   - Split large review arrays to `reviews/en.json`

4. **Extract metadata**
   - Convert `trips_metadata.js` to `trips-metadata.json`

**Success Criteria:**
- ✅ All data accessible via imports
- ✅ No global pollution
- ✅ JSON files validate correctly

### Phase 3: Service Layer (Week 4)
**Priority: Medium | Risk: Medium**

1. **Create service classes**
   - `ImageService` (from image_paths.js logic)
   - `I18nService` (from main.js translation logic)
   - `StorageService` (localStorage wrapper)

2. **Refactor existing services**
   - Keep `api.service.js` (already well-structured)
   - Add error handling
   - Add TypeScript JSDoc comments

3. **Update consumers**
   - Replace `window.ImagePaths.getPoster()` with `ImageService.getPoster()`
   - Replace `window.i18nEn` with `I18nService.translate()`

**Success Criteria:**
- ✅ No window globals for services
- ✅ All services tested
- ✅ Backward compatibility maintained

### Phase 4: View Layer Refactoring (Week 5-6)
**Priority: Medium | Risk: High**

1. **Extract templates**
   - Move HTML template functions to `views/templates/`
   - Make templates pure (no side effects)

2. **Refactor renderers**
   - Separate rendering logic from DOM manipulation
   - Use dependency injection

3. **Implement view controllers**
   - Create controllers for each major view
   - Handle user interactions
   - Coordinate between services and views

**Success Criteria:**
- ✅ Templates are pure functions
- ✅ Renderers don't directly manipulate DOM
- ✅ Controllers handle orchestration

### Phase 5: SSG Preparation (Week 7-8)
**Priority: Low | Risk: Medium**

1. **Create build scripts**
   - Node.js script to fetch data at build time
   - Generate static HTML for key pages

2. **Implement hydration**
   - Minimal JS for interactivity
   - Progressive enhancement

3. **Test static generation**
   - Verify pages work without JS
   - Test with slow connections

**Success Criteria:**
- ✅ Static HTML generated successfully
- ✅ Pages functional without JS
- ✅ Hydration works correctly

---

## 6. RISK ASSESSMENT

### High Risk Areas

1. **CSS Refactoring**
   - **Risk**: Breaking visual consistency
   - **Mitigation**: Visual regression testing, incremental migration
   - **Rollback**: Keep original `style.css` as backup

2. **Global Variable Removal**
   - **Risk**: Breaking existing integrations
   - **Mitigation**: Gradual migration, maintain compatibility layer
   - **Rollback**: Temporary shims for backward compatibility

3. **DOM Manipulation Changes**
   - **Risk**: Breaking dynamic features
   - **Mitigation**: Comprehensive testing, feature flags
   - **Rollback**: Keep old renderers alongside new ones

### Medium Risk Areas

1. **Data Format Changes**
   - **Risk**: Breaking data consumers
   - **Mitigation**: Schema validation, migration scripts

2. **Service Layer Introduction**
   - **Risk**: Performance regression
   - **Mitigation**: Benchmarking, lazy loading

### Low Risk Areas

1. **Directory Restructuring**
   - **Risk**: Build configuration issues
   - **Mitigation**: Vite handles imports automatically

2. **Code Organization**
   - **Risk**: Developer confusion
   - **Mitigation**: Documentation, team training

---

## 7. TESTING STRATEGY

### Unit Tests
```javascript
// services/image.service.test.js
import { ImageService } from './image.service.js';

describe('ImageService', () => {
  test('resolves poster path correctly', () => {
    const path = ImageService.getPoster('sharm', 'sea', 'ras_mohammed');
    expect(path).toBe('/assets/images/trips/sharm/sea/ras_mohammed/poster.webp');
  });
});
```

### Integration Tests
```javascript
// controllers/trips.controller.test.js
import { TripsController } from './trips.controller.js';

describe('TripsController', () => {
  test('renders trips grid with data', async () => {
    const controller = new TripsController(mockServices);
    const html = await controller.renderGrid();
    expect(html).toContain('trip-card');
  });
});
```

### Visual Regression Tests
```javascript
// Use Playwright or Puppeteer
await page.goto('http://localhost:5173');
await page.screenshot({ path: 'screenshots/home.png' });
// Compare with baseline
```

---

## 8. PERFORMANCE CONSIDERATIONS

### Bundle Size Analysis

**Current (Estimated):**
- CSS: ~150KB (unminified)
- JS: ~200KB (all modules)
- Total: ~350KB

**After Refactoring (Estimated):**
- CSS: ~140KB (better tree-shaking)
- JS: ~180KB (removed duplication)
- Total: ~320KB
- **Improvement: ~10% reduction**

### Code Splitting Opportunities

```javascript
// Lazy load heavy features
const DetailsRenderer = await import('./modules/details-renderer.js');
const BookingManager = await import('./modules/booking-manager.js');
```

### Caching Strategy

```javascript
// Service Worker for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/assets/')) {
    event.respondWith(caches.match(event.request));
  }
});
```

---

## 9. DEVELOPER EXPERIENCE IMPROVEMENTS

### Before Refactoring
```javascript
// Hard to find where styles are defined
// Hard to understand data flow
// Global variables everywhere
// Mixed concerns
```

### After Refactoring
```javascript
// Clear file structure
import { ImageService } from '@/services/image.service.js';
import { I18nService } from '@/services/i18n.service.js';

// Type safety with JSDoc
/** @param {Trip} trip */
function renderTrip(trip) {
  return ImageService.getPoster(trip.location, trip.category, trip.id);
}

// Easy to test
// Easy to understand
// Easy to extend
```

---

## 10. CONCLUSION & NEXT STEPS

### Summary

This refactoring will transform the Fabio Landing project from a **monolithic architecture** to a **modular, maintainable, and scalable clean architecture** while leveraging Vite's powerful bundling capabilities.

### Key Benefits

1. **Maintainability**: Smaller, focused files (400 lines max vs 4000 lines)
2. **Scalability**: Easy to add new features without touching existing code
3. **Performance**: Better tree-shaking and code splitting
4. **Developer Experience**: Clear structure, easier onboarding
5. **Future-Proof**: Ready for SSG, TypeScript, or framework migration

### Immediate Next Steps

1. **Review this analysis** with the team
2. **Prioritize phases** based on business needs
3. **Set up testing infrastructure** (visual regression, unit tests)
4. **Create feature branch** for CSS refactoring (lowest risk)
5. **Begin Phase 1** (CSS modularization)

### Long-Term Vision

- **TypeScript Migration**: Add type safety
- **Component Framework**: Consider Lit, Svelte, or React
- **SSG/SSR**: Full static site generation
- **Monorepo**: Separate packages for reusable components

---

**End of Analysis Report**
