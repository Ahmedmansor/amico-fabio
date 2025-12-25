const i18nData = {
  it: window.i18nIt,
  en: window.i18nEn
};

let currentLang = "it";

function getValueByPath(root, path) {
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

  const langToggle = document.getElementById("langToggle");
  if (langToggle) langToggle.textContent = dataset.nav_lang;

  const heroImage = document.querySelector(".hero-photo");
  const heroSrc = getValueByPath(dataset, "page1.hero_img");
  if (heroImage && typeof heroSrc === "string") {
    heroImage.src = heroSrc;
  }

  const farshaImage = document.querySelector(".farsha-photo");
  const farshaSrc = getValueByPath(dataset, "page6.img");
  if (farshaImage && typeof farshaSrc === "string") {
    farshaImage.src = farshaSrc;
  }
}

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
    <button type="button" class="adventure-card" data-index="${String(index)}" data-aos="zoom-in">
      <img src="${imgSrc}" class="adventure-photo" alt="">
      <div class="adventure-caption">${item.cap || ""}</div>
    </button>
  `;
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
  renderComponent("servicesFlow", "page2.services", universalTemplate);
  renderComponent("rules-page3", "page3.rules", universalTemplate);
  renderComponent("rules-page4", "page4.rules", universalTemplate);
  renderComponent("packing-checklist", "page5.items", checklistTemplate);
  renderComponent("adventuresGrid", "page7.items", adventuresTemplate);
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

// تنفيذ الكود عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  initializeAOS();
  applyTranslations(currentLang);
  attachLanguageToggle();
  attachIndexToggle();
  attachAdventuresModal();
});
