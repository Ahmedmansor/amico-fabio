const i18nData = {
  it: window.i18nIt,
  en: window.i18nEn
};

let currentLang = "it";

/**
 * تحسين دالة التوصيف النصي لتشمل العناوين والفقرات والأقسام الجديدة
 */
function applyTextContent(lang) {
  const dataset = i18nData[lang];
  if (!dataset) return;

  const selectors = document.querySelectorAll("[data-i18n]");
  selectors.forEach((element) => {
    const keyPath = element.getAttribute("data-i18n");
    const segments = keyPath.split(".");
    let value = dataset;
    for (let segment of segments) {
      if (value && Object.prototype.hasOwnProperty.call(value, segment)) {
        value = value[segment];
      } else {
        value = null;
        break;
      }
    }
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  // تحديث نص زر اللغة
  const langToggle = document.getElementById("langToggle");
  if (langToggle) langToggle.textContent = dataset.nav_lang;

  // تحديث قسم الخدمات (Page 2)
  const services = dataset.page2?.services || [];
  const serviceItems = document.querySelectorAll(".service-item"); // تأكد من استخدام هذا الكلاس في الـ HTML
  serviceItems.forEach((item, index) => {
    const titleEl = item.querySelector(".service-title");
    const descEl = item.querySelector(".service-desc");
    if (services[index]) {
      if (titleEl) titleEl.textContent = services[index].name;
      if (descEl) descEl.textContent = services[index].desc;
    }
  });
}

/**
 * دالة محسنة لعرض القواعد مع وصف طويل وصور
 */
function renderRules(containerId, pageKey, lang) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const page = i18nData[lang]?.[pageKey];
  const rules = page?.rules || [];

  // عرض النص التقديمي للقسم
  const introEl = document.querySelector(`[data-i18n="${pageKey}.intro"]`);
  if (introEl) introEl.textContent = page.intro;

  container.innerHTML = "";
  rules.forEach((rule, index) => {
    const card = document.createElement("article");
    card.className = "rule-section"; // Mobile-first structure
    card.setAttribute("data-aos", "fade-up");

    // الهيكل: نص ثم صورة (كما طلبت للموبايل)
    const imageSrc = getRuleImageSource(pageKey, index);
    card.innerHTML = `
      <div class="rule-text-content">
        <h3 class="rule-title">${rule.title}</h3>
        <p class="rule-desc">${rule.desc}</p>
      </div>
      <div class="rule-image-container">
        <img src="${imageSrc}" alt="${rule.title}" class="rule-img" loading="lazy">
      </div>
    `;
    container.appendChild(card);
  });
}

/**
 * دالة محسنة لعرض قائمة الحقيبة مع وصف أيقونات
 */
function renderChecklist(listId, pageKey, lang) {
  const container = document.getElementById(listId);
  if (!container) return;

  const page = i18nData[lang]?.[pageKey];
  const items = page?.items || [];

  container.innerHTML = "";
  items.forEach((item, index) => {
    const itemBox = document.createElement("div");
    itemBox.className = "checklist-item";
    itemBox.setAttribute("data-aos", "zoom-in");

    const iconClasses = [
      "fa-solid fa-shirt",
      "fa-solid fa-shoe-prints",
      "fa-solid fa-sun",
      "fa-solid fa-passport"
    ];
    const iconClass = iconClasses[index] || iconClasses[0];

    itemBox.innerHTML = `
      <div class="checklist-icon">
        <i class="${iconClass} checklist-icon-glyph" aria-hidden="true"></i>
      </div>
      <div class="checklist-text">
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
      </div>
    `;
    container.appendChild(itemBox);
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
    { id: "#page1", key: "page1.headline" },
    { id: "#page2", key: "page2.headline" },
    { id: "#page3", key: "page3.headline" },
    { id: "#page4", key: "page4.headline" },
    { id: "#page5", key: "page5.list_title" },
    { id: "#page6", key: "page6.highlight" },
    { id: "#page7", key: "page7.title" }
  ];
  nav.innerHTML = "";
  sections.forEach((section, index) => {
    let labelValue = dataset;
    const parts = section.key.split(".");
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (labelValue && Object.prototype.hasOwnProperty.call(labelValue, part)) {
        labelValue = labelValue[part];
      } else {
        labelValue = null;
        break;
      }
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "index-link";
    if (typeof labelValue === "string") {
      button.textContent = String(index + 1) + " · " + labelValue;
    } else {
      button.textContent = "Section " + String(index + 1);
    }
    button.addEventListener("click", () => {
      hideIndexMenu();
      scrollToSection(section.id);
    });
    nav.appendChild(button);
  });
}

function applyTranslations(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  applyTextContent(lang);
  renderRules("rules-page3", "page3", lang);
  renderRules("rules-page4", "page4", lang);
  renderChecklist("packing-checklist", "page5", lang);
  renderAdventures(lang);
  renderIndexMenu(lang);
  const langButtons = document.querySelectorAll(".lang-btn");
  langButtons.forEach((button) => {
    const value = button.getAttribute("data-lang");
    button.classList.toggle("is-active", value === lang);
  });

  if (window.AOS) window.AOS.refreshHard();
}

function attachLanguageToggle() {
  const langToggle = document.getElementById("langToggle");
  if (langToggle) {
    langToggle.addEventListener("click", () => {
      const nextLang = currentLang === "it" ? "en" : "it";
      applyTranslations(nextLang);
    });
  }
  const langButtons = document.querySelectorAll(".lang-btn");
  langButtons.forEach((button) => {
    const value = button.getAttribute("data-lang");
    if (!value) return;
    button.addEventListener("click", () => {
      if (value !== currentLang) {
        applyTranslations(value);
      }
    });
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

function getRuleImageSource(pageKey, index) {
  const map = {
    page3: [
      "../assets/secrets_catalogue/euro-coins-no.jpg",
      "../assets/secrets_catalogue/sim-card-solo-negozi-ufficiali.jpg",
      "../assets/secrets_catalogue/taxi-prezzo-concordato.jpg",
      "../assets/secrets_catalogue/antinal.jpg"
    ],
    page4: [
      "../assets/secrets_catalogue/dress-code.jpg",
      "../assets/secrets_catalogue/negoziare.jpg",
      "../assets/secrets_catalogue/coralli.jpg",
      "../assets/secrets_catalogue/baksheesh.jpg"
    ]
  };
  const list = map[pageKey] || [];
  return list[index] || list[0] || "";
}

function renderAdventures(lang) {
  const container = document.getElementById("adventuresGrid");
  if (!container) return;
  const dataset = i18nData[lang];
  const page = dataset && dataset.page7;
  const items = page && Array.isArray(page.items) ? page.items : [];
  const imageSources = [
    "../assets/adventures/pilot.jpg",
    "../assets/adventures/eiffel-tower.jpg",
    "../assets/adventures/red-square.jpg",
    "../assets/adventures/diving.jpg"
  ];
  container.innerHTML = "";
  items.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "adventure-card";
    card.setAttribute("data-index", String(index));
    card.setAttribute("data-aos", "zoom-in");
    const src = imageSources[index] || imageSources[0];
    card.innerHTML = `
      <img src="${src}" class="adventure-photo" alt="">
      <div class="adventure-caption">${item && item.cap ? item.cap : ""}</div>
    `;
    container.appendChild(card);
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
      const page = dataset && dataset.page7;
      const items = page && Array.isArray(page.items) ? page.items : [];
      const item = items[index] || items[0];
      const imageSources = [
        "../assets/adventures/pilot.jpg",
        "../assets/adventures/eiffel-tower.jpg",
        "../assets/adventures/red-square.jpg",
        "../assets/adventures/diving.jpg"
      ];
      const src = imageSources[index] || imageSources[0];
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

// تنفيذ الكود عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  initializeAOS();
  applyTranslations(currentLang);
  attachLanguageToggle();
  attachIndexToggle();
  attachAdventuresModal();
});
