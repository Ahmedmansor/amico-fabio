
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

const i18nData = {
  it: window.i18nIt,
  en: window.i18nEn
};

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
  const dataset = i18nData[lang];
  if (!dataset) return;

  const selectors = document.querySelectorAll("[data-i18n]");
  selectors.forEach((element) => {
    const keyPath = element.getAttribute("data-i18n");
    const value = getValueByPath(dataset, keyPath);
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  // Images with data-img
  const imgSelectors = document.querySelectorAll("[data-img]");
  imgSelectors.forEach((img) => {
    const keyPath = img.getAttribute("data-img");
    const src = getValueByPath(dataset, keyPath);
    if (typeof src === "string") {
      img.src = src;
    }
  });
}

function applyTranslations(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  localStorage.setItem("fabio_lang", lang);
  localStorage.setItem("preferredLanguage", lang);

  applyTextContent(lang);

  // Re-render components if on Sharm Secrets page
  if (document.getElementById("servicesFlow")) {
    renderComponent("servicesFlow", "secrets.page2.services", universalTemplate);
    renderComponent("rules-page3", "secrets.page3.rules", universalTemplate);
    renderComponent("packing-checklist", "secrets.page4.items", checklistTemplate);
    renderComponent("adventuresGrid", "secrets.page6.items", adventuresTemplate);
    setupAdventuresSlider();
    renderIndexMenu(lang);
  }

  // Re-render trips if on Trip Catalog page
  if (document.getElementById("trips-grid") && window.appData && window.appData.Trips_Prices) {
    if (window.TripsRenderer) {
      window.TripsRenderer.render(window.appData.Trips_Prices);
    }
  }

  // Re-render promo banner
  if (window.PromoBanner && window.appData && window.appData.Global_Settings) {
    window.PromoBanner.render(window.appData.Global_Settings);
  }

  // Re-render legal page if present
  if (typeof window.renderLegal === "function") {
    try { window.renderLegal(lang); } catch (e) { /* noop */ }
  }

  if (window.AOS) window.AOS.refreshHard();
}


// ==========================================
// Sharm Secrets Rendering Logic
// ==========================================

function renderComponent(containerId, dataPath, template) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const dataset = i18nData[currentLang];
  if (!dataset) return;

  const data = getValueByPath(dataset, dataPath);
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

  if (window.AOS) window.AOS.refreshHard();
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
    <article class="catalog-card" data-aos="fade-up"${safeDelay !== "0" ? ` data-aos-delay="${safeDelay}"` : ""}>
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

function checklistTemplate(item) {
  if (!item) return "";
  const iconToken = typeof item.icon === "string" ? item.icon : "";
  const iconClass = iconToken ? `fa-solid ${iconToken} checklist-icon-glyph` : "fa-solid fa-circle checklist-icon-glyph";
  return `
    <div class="checklist-item" data-aos="zoom-in">
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
    <div class="swiper-slide">
      <button type="button" class="adventure-card" data-index="${String(index)}" data-aos="zoom-in">
        <img src="${imgSrc}" class="adventure-photo" alt="" loading="lazy" decoding="async">
        <div class="adventure-caption">${item.cap || ""}</div>
      </button>
    </div>
  `;
}

let swiperInstance = null;

function setupAdventuresSlider() {
  if (swiperInstance) {
    swiperInstance.destroy(true, true);
  }

  // Only init if element exists
  if (!document.querySelector(".adventures-slider")) return;

  swiperInstance = new Swiper(".adventures-slider", {
    loop: true,
    centeredSlides: true,
    grabCursor: true,
    slidesPerView: 1,
    spaceBetween: 20,
    speed: 600,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      640: {
        slidesPerView: 1.5,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
      }
    }
  });
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
  const dataset = i18nData[lang];
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
    const labelValue = getValueByPath(dataset, section.key);
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
      const dataset = i18nData[currentLang];

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

function initializeAOS() {
  if (window.AOS) {
    window.AOS.init({ once: true, duration: 800, easing: "ease-out-cubic", offset: 100 });
  }
}

// ==========================================
// App Initialization
// ==========================================

const App = {
  init: async () => {
    // 0. Init UI Layout (Header/Footer) immediately
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

    // 1. Initialize Language Engine
    const savedFabioLang = localStorage.getItem("fabio_lang");
    const legacyPreferred = localStorage.getItem("preferredLanguage");
    const bootstrapLang = savedFabioLang || legacyPreferred || "it";
    if (bootstrapLang && i18nData[bootstrapLang]) {
      currentLang = bootstrapLang;
    }

    // Initial translation apply
    applyTranslations(currentLang);

    // 2. Route based on page
    if (document.getElementById('trips-grid')) {
      await App.initTripCatalog();
    } else {
      App.initSharmSecrets();
    }

    // Global AOS init
    initializeAOS();

    // Who Fabio Parallax (index only)
    const whoFabioEl = document.getElementById('who-fabio');
    if (whoFabioEl && window.WhoFabioParallax) {
      try {
        window.WFParallax = window.WFParallax || new window.WhoFabioParallax(whoFabioEl);
      } catch (e) { /* noop */ }
    }
  },

  initTripCatalog: async () => {
    const grid = document.getElementById('trips-grid');
    if (grid) {
      // Add loading spinner
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--color-gold);"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    }

    // 3. Call Data Layer
    if (window.api && window.api.fetchAllData) {
      const data = await window.api.fetchAllData();

      // Safety check: ensure we have data or use dummy
      const finalData = data || window.api.DUMMY_DATA;

      if (!finalData) {
        console.error("App: Data fetch returned null and no DUMMY_DATA available.");
        return;
      }

      window.appData = finalData; // Store state

      // 4. Trigger Renderer
      if (window.TripsRenderer && finalData.Trips_Prices) {
        window.TripsRenderer.render(finalData.Trips_Prices);
      }

      // 5. Trigger Promo Banner
      if (window.PromoBanner && finalData.Global_Settings) {
        window.PromoBanner.render(finalData.Global_Settings);
      }

      // 6. Init Global UI (Header/Footer)
      if (window.UILayout) {
        window.UILayout.init();
      }

      if (!window.TripsRenderer || !finalData.Trips_Prices) {
        // Handle empty or failed data
        const grid = document.getElementById('trips-grid');
        if (grid) {
          const lang = localStorage.getItem("fabio_lang") || document.documentElement.lang || "it";
          const i18n = lang === "en" ? (window.i18nEn || {}) : (window.i18nIt || {});
          const msg = i18n.global && typeof i18n.global.loading_failed === "string" ? i18n.global.loading_failed : "";
          grid.innerHTML = `<div class="col-span-full text-center py-12">
                <p class="text-gold text-xl" data-i18n="global.loading_failed">${msg}</p>
            </div>`;
        }
      }
    } else {
      console.error("API module not found");
    }
  },

  initSharmSecrets: () => {
    attachIndexToggle();
    attachAdventuresModal();

    // Note: Render calls are handled in applyTranslations for dynamic language switching
    // We just ensure initial setup here if needed, but applyTranslations calls them.
  }
};

// Global access to App logic if needed
window.appData = window.appData || {};
window.appData.openBooking = (tripId) => {
  const fabioNumber = "201063239261";
  const message = `Ciao Fabio! I want to book trip: ${tripId}`;
  window.open(`https://wa.me/${fabioNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
