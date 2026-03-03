// assets/js/main.js

// ==========================================
// Phase 4: Service Layer Integration
// ==========================================
import { I18nService } from './services/i18n.service.js';
import { ApiService } from './services/api.service.js';
import { ImageService } from './services/image.service.js';
import { StorageService } from './services/storage.service.js';

// Legacy imports (will be phased out)
import './image_paths.js';
import './core/api.js';
import './trips_metadata.js';

// UI Modules
import './modules/global-header.js';
import './modules/global-footer.js';
import './modules/hero-slider.js';
import './modules/who-fabio.js';
import './modules/trips-renderer.js';
import { initReviews } from './modules/reviews-renderer.js';

// Backward Compatibility: Expose services to window for legacy scripts
window.I18nService = I18nService;
window.ApiService = ApiService;
window.ImageService = ImageService;
window.StorageService = StorageService;

console.log('Fabio Tours App Started (Phase 4)');

// Service Worker cleanup
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(r => {
    r.unregister();
  });
});

if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      caches.delete(name);
    });
  });
}

// ==========================================
// App Orchestrator & Main Controller
// ==========================================

let currentLang = "it";

// Simple deep object access
function getValueByPath(root, path) {
  if (!root || !path) return null;
  const segments = path.split(".");
  let value = root;
  for (let i = 0; i < segments.length; i += 1) {
    const key = segments[i];
    if (value && Object.prototype.hasOwnProperty.call(value, key)) {
      value = value[key];
    } else {
      return null;
    }
  }
  return value;
}

// ==========================================
// Language Engine
// ==========================================

function applyTextContent(lang) {
  const dataset = I18nService.getAll();
  if (!dataset) return;

  const selectors = document.querySelectorAll("[data-i18n]");
  selectors.forEach((element) => {
    const keyPath = element.getAttribute("data-i18n");
    const value = I18nService.translate(keyPath);
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  // Images with data-img
  const imgSelectors = document.querySelectorAll("[data-img]");
  imgSelectors.forEach((img) => {
    const keyPath = img.getAttribute("data-img");
    const value = I18nService.translate(keyPath);
    if (typeof value === "string") {
      img.src = value;
    }
  });

  // Images with data-landing-img (ImageService access)
  const landingImgSelectors = document.querySelectorAll("[data-landing-img]");
  landingImgSelectors.forEach((img) => {
    const keyPath = img.getAttribute("data-landing-img");
    const imagePaths = ImageService.getAll();
    const src = getValueByPath(imagePaths, keyPath);
    if (typeof src === "string") {
      img.src = ImageService.resolve(src);
    }
  });
}

async function applyTranslations(lang) {
  // Switch language using I18nService
  await I18nService.switchLanguage(lang);
  
  currentLang = lang;
  document.documentElement.lang = lang;
  StorageService.setLocal("lang", lang);
  localStorage.setItem("fabio_lang", lang);
  localStorage.setItem("preferredLanguage", lang);

  applyTextContent(lang);
  initReviews(lang);
  window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));

  // Re-render components if on Sharm Secrets page
  if (document.getElementById("servicesFlow")) {
    renderComponent("servicesFlow", "secrets.page2.services", universalTemplate);
    renderComponent("rules-page3", "secrets.page3.rules", universalTemplate);
    renderComponent("packing-checklist", "secrets.page4.items", checklistTemplate);
    renderComponent("adventuresGrid", "secrets.page6.items", adventuresTemplate);
    setupAdventuresAutoScroll();
    renderIndexMenu(lang);
  }

  // Home page uses static location cards; no dynamic re-render on #trips-grid

  // Re-render promo banner
  if (window.PromoBanner && window.appData && window.appData.Global_Settings) {
    window.PromoBanner.render(window.appData.Global_Settings);
  }

  // Re-render legal page if present
  if (typeof window.renderLegal === "function") {
    try { window.renderLegal(lang); } catch (e) { /* noop */ }
  }


}

window.applyTranslations = applyTranslations;


// ==========================================
// Sharm Secrets Rendering Logic
// ==========================================

function renderComponent(containerId, dataPath, template) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const dataset = I18nService.getAll();
  if (!dataset) return;

  const data = I18nService.translate(dataPath);
  container.innerHTML = "";

  if (Array.isArray(data)) {
    const fragment = document.createDocumentFragment();
    data.forEach((item, index) => {
      const html = template(item, index, dataset);
      if (!html) return;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html.trim();
      while (wrapper.firstChild) {
        fragment.appendChild(wrapper.firstChild);
      }
    });
    container.appendChild(fragment);
  } else if (data && typeof data === "object") {
    const html = template(data, 0, dataset);
    if (html) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html.trim();
      while (wrapper.firstChild) {
        container.appendChild(wrapper.firstChild);
      }
    }
  }


}

function universalTemplate(item, index) {
  if (!item) return "";
  const delay = index === 0 ? 0 : index * 80;
  const safeDelay = String(delay);
  const imgSrc = typeof item.img === "string" ? item.img : "";
  const title = item.title || item.name || "";
  const desc = item.desc || "";
  const extraTitle = item.extra_title || "";
  const extraDesc = item.extra_desc || "";
  const hasExtra = extraTitle || extraDesc;
  const extraBlock = hasExtra
    ? `
      <div class="catalog-card-extra">
        ${extraTitle ? `<h4 class="catalog-card-extra-title">${extraTitle}</h4>` : ""}
        ${extraDesc ? `<p class="catalog-card-extra-desc">${extraDesc}</p>` : ""}
      </div>
    `
    : "";
  return `
    <article class="catalog-card sharm-reveal"${safeDelay !== "0" ? ` style="animation-delay: ${safeDelay}ms"` : ""}>
      <div class="catalog-card-main">
        <h3 class="catalog-card-title">${title}</h3>
        <p class="catalog-card-desc">${desc}</p>
      </div>
      <div class="catalog-card-image">
        <img src="${imgSrc}" alt="${title}" class="catalog-card-img" loading="lazy">
      </div>
      ${extraBlock}
    </article>
  `;
}

function checklistTemplate(item, index) {
  if (!item) return "";
  const iconToken = typeof item.icon === "string" ? item.icon : "";
  const iconClass = iconToken ? `fa-solid ${iconToken} checklist-icon-glyph` : "fa-solid fa-circle checklist-icon-glyph";
  return `
    <div class="checklist-item sharm-reveal" style="animation-delay: ${index * 70}ms">
      <div class="checklist-icon">
        <i class="${iconClass}" aria-hidden="true"></i>
      </div>
      <div class="checklist-text">
        <h4>${item.title || ""}</h4>
        <p>${item.desc || ""}</p>
      </div>
    </div>
  `;
}

function adventuresTemplate(item, index) {
  if (!item) return "";
  const imgSrc = typeof item.img === "string" ? item.img : "";
  return `
    <div class="adventure-slide">
      <button type="button" class="adventure-card sharm-reveal" data-index="${String(index)}" style="animation-delay: ${index * 80}ms">
        <img src="${imgSrc}" class="adventure-photo" alt="" loading="lazy" decoding="async">
        <div class="adventure-caption">${item.cap || ""}</div>
      </button>
    </div>
  `;
}

let adventuresAutoTimer = null;
let adventuresResumeTimer = null;

function setupAdventuresAutoScroll() {
  const track = document.getElementById("adventuresGrid");
  if (!track) return;
  if (track.dataset.autoScrollBound === "true") return;
  track.dataset.autoScrollBound = "true";

  const getStep = () => {
    const slide = track.querySelector(".adventure-slide");
    if (!slide) return 0;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.gap || styles.columnGap || "0");
    const width = slide.getBoundingClientRect().width;
    return width + gap;
  };

  const scrollNext = () => {
    const step = getStep();
    if (!step) return;
    const max = track.scrollWidth - track.clientWidth;
    if (max <= 0) return;
    const next = track.scrollLeft + step;
    track.scrollTo({ left: next >= max - 2 ? 0 : next, behavior: "smooth" });
  };

  const start = () => {
    if (adventuresAutoTimer) clearInterval(adventuresAutoTimer);
    adventuresAutoTimer = setInterval(scrollNext, 2000);
  };

  const pause = () => {
    if (adventuresAutoTimer) clearInterval(adventuresAutoTimer);
    if (adventuresResumeTimer) clearTimeout(adventuresResumeTimer);
    adventuresResumeTimer = setTimeout(start, 2500);
  };

  track.addEventListener("pointerdown", pause, { passive: true });
  track.addEventListener("wheel", pause, { passive: true });
  track.addEventListener("touchstart", pause, { passive: true });
  track.addEventListener("scroll", pause, { passive: true });
  start();
}

function scrollToSection(targetId) {
  const target = document.querySelector(targetId);
  if (!target) return;
  const headerOffset = 80;
  const rect = target.getBoundingClientRect();
  const offset = window.scrollY + rect.top - headerOffset;
  window.scrollTo({ top: offset, behavior: "smooth" });
}

function showIndexMenu() {
  const menu = document.getElementById("indexMenu");
  if (!menu) return;
  menu.classList.add("is-visible");
}

function hideIndexMenu() {
  const menu = document.getElementById("indexMenu");
  if (!menu) return;
  menu.classList.remove("is-visible");
}

function renderIndexMenu(lang) {
  const dataset = I18nService.getAll();
  if (!dataset) return;
  const menu = document.getElementById("indexMenu");
  if (!menu) return;
  const nav = menu.querySelector(".index-menu-nav");
  if (!nav) return;
  const sections = [
    { id: "#page1", key: "secrets.page1.headline" },
    { id: "#page2", key: "secrets.page2.headline" },
    { id: "#page3", key: "secrets.page3.headline" },
    { id: "#page4", key: "secrets.page4.list_title" },
    { id: "#page5", key: "secrets.page5.highlight" },
    { id: "#page6", key: "secrets.page6.title" }
  ];
  nav.innerHTML = "";
  sections.forEach((section, index) => {
    const labelValue = I18nService.translate(section.key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "index-link";
    if (typeof labelValue === "string") {
      button.textContent = `${index + 1} · ${labelValue}`;
    } else {
      button.textContent = `Section ${index + 1}`;
    }
    button.addEventListener("click", () => {
      hideIndexMenu();
      scrollToSection(section.id);
    });
    nav.appendChild(button);
  });
}

function attachIndexToggle() {
  const indexToggle = document.getElementById("indexToggle");
  const menu = document.getElementById("indexMenu");
  if (!indexToggle || !menu) return;
  const close = menu.querySelector(".index-menu-close");
  indexToggle.addEventListener("click", () => {
    showIndexMenu();
  });
  if (close) {
    close.addEventListener("click", () => {
      hideIndexMenu();
    });
  }
  menu.addEventListener("click", (event) => {
    if (event.target === menu) {
      hideIndexMenu();
    }
  });
}

function attachAdventuresModal() {
  const modal = document.getElementById("adventuresModal");
  const image = document.getElementById("adventuresModalImage");
  const caption = document.getElementById("adventuresModalCaption");
  if (!modal || !image || !caption) return;
  const closeButton = modal.querySelector(".adventures-modal-close");
  const grid = document.getElementById("adventuresGrid");
  if (grid) {
    grid.addEventListener("click", (event) => {
      const target = event.target;
      const card = target.closest(".adventure-card");
      if (!card) return;
      const indexValue = card.getAttribute("data-index");
      const index = indexValue ? parseInt(indexValue, 10) : 0;
      const dataset = I18nService.getAll();

      const page = dataset && dataset.secrets && dataset.secrets.page6;
      const items = page && Array.isArray(page.items) ? page.items : [];
      const item = items[index] || items[0];
      const src = item && typeof item.img === "string" ? item.img : "";
      image.src = src;
      caption.textContent = item && item.cap ? item.cap : "";
      modal.classList.add("is-visible");
    });
  }
  function closeModal() {
    modal.classList.remove("is-visible");
  }
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      closeModal();
    });
  }
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

function setupSecretsBackgrounds() {
  const imagePaths = ImageService.getAll();
  if (!imagePaths || !imagePaths.secrets || !imagePaths.secrets.bg) return;
  const bg = imagePaths.secrets.bg;

  const setBg = (selector, imageUrl) => {
    const el = document.querySelector(selector);
    if (el) el.style.setProperty('--bg-image', `url('${imageUrl}')`);
  };

  setBg('.section-hero', bg.hero);
  setBg('.section-2', bg.sec2);
  setBg('.section-3', bg.sec3);
  setBg('.section-4', bg.sec4);
  setBg('.section-5', bg.sec5);
  setBg('.section-6', bg.sec6);
}

// ==========================================
// App Initialization
// ==========================================

const App = {
  init: async () => {
    try {
      // 0. Init UI Layout (Header/Footer) immediately - ALWAYS RUN
      if (window.UILayout) {
        window.UILayout.init();
      }

      // Why: Proactively unregister legacy Service Workers to avoid stale caching during refactor.
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      }

      // 1. Initialize Language Engine with I18nService
      const savedFabioLang = StorageService.getLocal("lang", null) || localStorage.getItem("fabio_lang");
      const legacyPreferred = localStorage.getItem("preferredLanguage");
      const bootstrapLang = savedFabioLang || legacyPreferred || "it";
      
      // Load initial language data
      await I18nService.loadLanguage(bootstrapLang);
      currentLang = bootstrapLang;

      // SSG Hydration Guard: Only skip translations if page is pre-rendered for current language
      const isStaticPage = window.IS_STATIC && window.STATIC_LANG === currentLang;
      
      if (!isStaticPage) {
        // Initial translation apply for dynamic pages or language mismatch
        await applyTranslations(currentLang);
      } else {
        console.log('SSG Hydration: Content pre-translated. Skipping text replacement.');
        // Still need to initialize reviews and dispatch lang event
        initReviews(currentLang);
        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: currentLang } }));
      }

      // 2. Route based on page - ALWAYS RUN to render UI components
      if (document.getElementById('trips-grid')) {
        await App.initTripCatalog();
      } else {
        App.initSharmSecrets();
      }

      // Who Fabio Parallax (index only)
      const whoFabioEl = document.getElementById('who-fabio');
      if (whoFabioEl && window.WhoFabioParallax) {
        try {
          window.WFParallax = window.WFParallax || new window.WhoFabioParallax(whoFabioEl);
        } catch (e) { /* noop */ }
      }
    } catch (error) {
      console.error('App initialization error:', error);
      
      // Show error message to user
      const main = document.querySelector('main');
      if (main) {
        const msg = I18nService.translate('global.loading_failed') || "An error occurred. Please refresh the page.";
        main.innerHTML = `<div class="h-screen flex items-center justify-center text-white">
          <p class="text-xl text-gold">${msg}</p>
        </div>`;
      }
    } finally {
      // SPINNER SAFETY: Always hide loading spinner
      const spinner = document.getElementById('loading-spinner') || document.querySelector('.loading-spinner');
      if (spinner) {
        spinner.style.display = 'none';
        spinner.classList.add('hidden');
      }
    }
  },

  initTripCatalog: async () => {
    const grid = document.getElementById('trips-grid');

    // 3. Fetch data using ApiService
    const data = await ApiService.fetchAllData();

    // Safety check: ensure we have data
    if (!data) {
      console.error("App: Data fetch returned null.");
      return;
    }

    window.appData = data; // Store state for backward compatibility

    // 4. Filter trips/packages to only include those with valid i18n entries
    if (data.Trips_Prices && Array.isArray(data.Trips_Prices)) {
      const originalCount = data.Trips_Prices.length;
      const validTrips = data.Trips_Prices.filter(trip => {
        // Skip items with empty or undefined trip_id
        if (!trip.trip_id || String(trip.trip_id).trim() === '') {
          return false;
        }
        const tripKey = `trips.${trip.trip_id}`;
        const translation = I18nService.translate(tripKey);
        // Only include if translation exists and is an object (not the key itself)
        return translation && typeof translation === 'object' && translation !== tripKey;
      });
      data.Trips_Prices = validTrips;
      console.log(`Filtered trips: ${validTrips.length} valid out of ${originalCount} total`);
    }

    if (data.Packages && Array.isArray(data.Packages)) {
      const originalCount = data.Packages.length;
      const validPackages = data.Packages.filter(pkg => {
        // Skip items with empty or undefined package_id/trip_id
        const pkgId = pkg.package_id || pkg.trip_id;
        if (!pkgId || String(pkgId).trim() === '') {
          return false;
        }
        const pkgKey = `packages.${pkgId}`;
        const translation = I18nService.translate(pkgKey);
        return translation && typeof translation === 'object' && translation !== pkgKey;
      });
      data.Packages = validPackages;
      console.log(`Filtered packages: ${validPackages.length} valid out of ${originalCount} total`);
    }

    // 5. Trigger Promo Banner
    if (window.PromoBanner && data.Global_Settings) {
      window.PromoBanner.render(data.Global_Settings);
    }

    // 6. Init Global UI (Header/Footer) - ALWAYS RUN
    if (window.UILayout) {
      window.UILayout.init();
    }

    // 7. Trip Cards are NOT rendered on homepage (index.html)
    // Homepage only shows the 3 location entry cards (Sharm, Cairo, Luxor/Aswan)
    // Trips are rendered in explore.html via ExploreRenderer
    // Keep this section for backward compatibility but don't render
    window.appData = data; // Store for other modules if needed
    setupFooterObserver();
  },

  initSharmSecrets: () => {
    setupSecretsBackgrounds();
    attachIndexToggle();
    attachAdventuresModal();
    setupFooterObserver();

    // Note: Render calls are handled in applyTranslations for dynamic language switching
    // We just ensure initial setup here if needed, but applyTranslations calls them.
  }
};

function setupFooterObserver() {
  const footer = document.getElementById('global-footer') || document.querySelector('footer');
  if (!footer) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Toggle a class on body to control floating widgets
      if (entry.isIntersecting) {
        document.body.classList.add('hide-floating-widgets');
      } else {
        document.body.classList.remove('hide-floating-widgets');
      }
    });
  }, {
    root: null,
    threshold: 0.1 // Trigger when 10% of footer is visible
  });

  observer.observe(footer);
}

// Global access to App logic if needed
window.appData = window.appData || {};
window.appData.openBooking = (tripId) => {
  const fabioNumber = "201063239261";
  const message = `Ciao Fabio! I want to book trip: ${tripId}`;
  window.open(`https://wa.me/${fabioNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
  
  // Handle hash navigation for smooth scrolling to sections
  if (window.location.hash) {
    const targetId = window.location.hash;
    
    // Enhanced function to check if page is fully ready
    const isPageReady = () => {
      const target = document.querySelector(targetId);
      if (!target) return false;
      
      // Check if target has dimensions (is rendered)
      const rect = target.getBoundingClientRect();
      return rect.height > 0 && rect.width > 0;
    };
    
    // Try multiple times with increasing delays and checks
    const attempts = [
      { delay: 100, check: isPageReady },
      { delay: 300, check: isPageReady },
      { delay: 600, check: isPageReady },
      { delay: 1000, check: isPageReady },
      { delay: 1500, check: isPageReady },
      { delay: 2000, check: () => true } // Force scroll at 2s even if not perfect
    ];
    
    attempts.forEach(({ delay, check }) => {
      setTimeout(() => {
        if (check()) {
          scrollToSection(targetId);
        }
      }, delay);
    });
  }
});
