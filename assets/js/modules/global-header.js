const GlobalHeader = {
  initLanguage: () => {
    const savedFabioLang = localStorage.getItem('fabio_lang');
    const legacyPreferred = localStorage.getItem('preferredLanguage');
    const legacyLang = localStorage.getItem('lang');
    const lang = savedFabioLang || legacyPreferred || legacyLang || 'it';
    // Why: Keep a single source of truth (fabio_lang) mirrored to preferredLanguage for backward compatibility across modules and pages.
    localStorage.setItem('fabio_lang', lang);
    localStorage.setItem('preferredLanguage', lang);
    document.documentElement.lang = lang;
    const dataset = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const getValueByPath = (root, path) => {
      if (!root || !path) return null;
      const segments = path.split('.');
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
    };
    // Why: If the main language engine is not yet loaded, apply a lightweight inline translation to prevent initial flicker.
    const applyDocumentTranslations = () => {
      const nodes = document.querySelectorAll('[data-i18n]');
      nodes.forEach((el) => {
        const keyPath = el.getAttribute('data-i18n');
        const value = getValueByPath(dataset, keyPath);
        if (typeof value === 'string') {
          el.textContent = value;
        }
      });
      const imgs = document.querySelectorAll('[data-img]');
      imgs.forEach((img) => {
        const keyPath = img.getAttribute('data-img');
        const src = getValueByPath(dataset, keyPath);
        if (typeof src === 'string') {
          img.src = src;
        }
      });
    };
    // Prefer the central applyTranslations if available (re-renders dynamic components consistently)
    if (typeof applyTranslations === 'function') {
      applyTranslations(lang);
    } else {
      applyDocumentTranslations();
    }
    return lang;
  },
  init: () => {
    const host = document.getElementById('global-header');
    if (!host) return;
    const lang = GlobalHeader.initLanguage();
    const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const menuDict = i18n.menu || {};
    const brandSubtitle = (i18n.global && i18n.global.brand_subtitle) ? i18n.global.brand_subtitle : '';
    const isSecrets = /\/sharm-secrets\//i.test(window.location.pathname);
    const basePath = isSecrets ? '../' : '';
    const flagSvg = (code) => {
      if (code === 'en') {
        return `
          <svg class="gh-flag-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <circle cx="256" cy="256" r="256" fill="#f0f0f0"/>
            <g clip-path="url(#clip-gb)">
              <path d="M0 0h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0zm0 78.8h512v39.3H0zm0 78.8h512v39.4H0zm0 78.8h512v39.4H0z" fill="#d80027"/>
              <path d="M0 0h262.2v275.6H0z" fill="#0052b4"/>
              <path d="M47.7 44.4l7.1 21.8h23.2l-18.6 13.5 7.1 21.8-18.6-13.5-18.6 13.5 7.1-21.8-18.6-13.5h23.2zM135.1 44.4l7.1 21.8h23.2l-18.6 13.5 7.1 21.8-18.6-13.5-18.6 13.5 7.1-21.8-18.6-13.5h23.2zM222.5 44.4l7.1 21.8h23.2l-18.6 13.5 7.1 21.8-18.6-13.5-18.6 13.5 7.1-21.8-18.6-13.5h23.2zM91.4 111.4l7 21.8h23.2l-18.6 13.5 7.1 21.8-18.6-13.5-18.6 13.5 7.1-21.8-18.6-13.5h23.1zM178.8 111.4l7.1 21.8h23.2l-18.6 13.5 7.1 21.8-18.6-13.5-18.6 13.5 7.1-21.8-18.6-13.5h23.2z" fill="#f0f0f0"/>
            </g>
            <defs><clipPath id="clip-gb"><circle cx="256" cy="256" r="256"/></clipPath></defs>
          </svg>
        `;
      }
      return `
        <svg class="gh-flag-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <circle cx="256" cy="256" r="256" fill="#f0f0f0"/>
          <path d="M0 256c0 113.4 73.5 209.7 175.4 243.4V12.6C73.5 46.3 0 142.6 0 256z" fill="#6da544"/>
          <path d="M512 256c0-113.4-73.5-209.7-175.4-243.4v486.8c101.9-33.7 175.4-130 175.4-243.4z" fill="#d80027"/>
        </svg>
      `;
    };
    const markup = `
      <div id="scroll-progress"></div>
      <div class="gh-container">
        <div class="gh-left">
          <button class="gh-menu-btn" id="gh-menu-btn">
            <img src="${basePath}assets/images/image_86a171.png" alt="Menu" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
            <svg class="gh-menu-fallback" viewBox="0 0 24 24">
              <rect x="3" y="5" width="18" height="2" fill="#fff"></rect>
              <rect x="3" y="11" width="18" height="2" fill="#fff"></rect>
              <rect x="3" y="17" width="18" height="2" fill="#fff"></rect>
            </svg>
          </button>
          <div class="gh-brand-wrap-left">
            <img src="${basePath}assets/images/logo/fabio-header-logo.png" class="gh-logo" alt="Fabio Tours Logo" />
            <div class="gh-brand">
              <div class="gh-brand-title">FABIO</div>
              <div class="gh-brand-subtitle" data-i18n="global.brand_subtitle">${brandSubtitle}</div>
            </div>
          </div>
          <div class="gh-dynamic-hook" id="gh-dynamic-hook"></div>
          <div class="gh-menu-dropdown" id="gh-menu-dropdown">
            <a href="#" data-nav="home" data-i18n="menu.home">${menuDict.home || ''}</a>
            <a href="#" data-nav="trips" data-i18n="menu.trips">${menuDict.trips || ''}</a>
            <a href="#" data-nav="reviews" data-i18n="menu.reviews">${menuDict.reviews || ''}</a>
            <a href="#" data-nav="secrets" data-i18n="menu.commandments">${menuDict.commandments || ''}</a>
            <a href="#" data-nav="blog" data-i18n="menu.blog">${menuDict.blog || ''}</a>
          </div>
        </div>
        <div class="gh-center" id="gh-center">
          <div class="gh-brand-wrap-center">
            <img src="${basePath}assets/images/logo/fabio-header-logo.png" class="gh-logo" alt="Fabio Tours Logo" />
            <div class="gh-brand">
              <div class="gh-brand-title">FABIO</div>
              <div class="gh-brand-subtitle" data-i18n="global.brand_subtitle">${brandSubtitle}</div>
            </div>
          </div>
          <nav class="gh-nav-inline" id="gh-nav-inline">
            <a href="#" data-nav="home" data-i18n="menu.home">${menuDict.home || ''}</a>
            <a href="#" data-nav="trips" data-i18n="menu.trips">${menuDict.trips || ''}</a>
            <a href="#" data-nav="reviews" data-i18n="menu.reviews">${menuDict.reviews || ''}</a>
            <a href="#" data-nav="secrets" data-i18n="menu.commandments">${menuDict.commandments || ''}</a>
            <a href="#" data-nav="blog" data-i18n="menu.blog">${menuDict.blog || ''}</a>
          </nav>
        </div>
        <div class="gh-right">
          <button class="gh-lang-btn" id="gh-lang-btn">
            ${flagSvg(lang)}
            <span class="gh-chevron">▼</span>
          </button>
          <div class="gh-lang-dropdown" id="gh-lang-dropdown">
            <button class="gh-lang-item ${lang === 'it' ? 'active' : ''}" data-lang="it">${flagSvg('it')}<span>Italiano</span></button>
            <button class="gh-lang-item ${lang === 'en' ? 'active' : ''}" data-lang="en">${flagSvg('en')}<span>English</span></button>
          </div>
        </div>
      </div>
    `;
    host.innerHTML = markup.trim();
    const left = host.querySelector('.gh-left');
    const right = host.querySelector('.gh-right');
    const menuBtn = host.querySelector('#gh-menu-btn');
    const menuDd = host.querySelector('#gh-menu-dropdown');
    const langBtn = host.querySelector('#gh-lang-btn');
    const langDd = host.querySelector('#gh-lang-dropdown');
    const center = host.querySelector('#gh-center');
    const navInline = host.querySelector('#gh-nav-inline');
    const progressBar = host.querySelector('#scroll-progress');
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      left.classList.toggle('open');
      right.classList.remove('open');
    });
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      right.classList.toggle('open');
      left.classList.remove('open');
    });
    document.addEventListener('click', () => {
      left.classList.remove('open');
      right.classList.remove('open');
    });
    menuDd.addEventListener('click', (e) => {
      const target = e.target.closest('[data-nav]');
      if (!target) return;
      e.preventDefault();
      const nav = target.getAttribute('data-nav');
      if (nav === 'home') {
        window.location.href = basePath + 'index.html';
        return;
      }
      if (nav === 'trips') {
        const el = document.getElementById('trips-grid');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = basePath + 'index.html#trips-grid';
        }
        return;
      }
      if (nav === 'reviews') {
        window.location.href = basePath + 'index.html#reviews';
        return;
      }
      if (nav === 'blog') {
        window.location.href = '#';
        return;
      }
      if (nav === 'secrets') {
        const link = isSecrets ? 'index.html' : basePath + 'sharm-secrets/index.html';
        window.location.href = link;
        return;
      }
    });
    if (navInline) {
      navInline.addEventListener('click', (e) => {
        const target = e.target.closest('[data-nav]');
        if (!target) return;
        e.preventDefault();
        const nav = target.getAttribute('data-nav');
        if (nav === 'home') {
          window.location.href = basePath + 'index.html';
          return;
        }
        if (nav === 'trips') {
          const el = document.getElementById('trips-grid');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.location.href = basePath + 'index.html#trips-grid';
          }
          return;
        }
        if (nav === 'reviews') {
          window.location.href = basePath + 'index.html#reviews';
          return;
        }
        if (nav === 'blog') {
          window.location.href = '#';
          return;
        }
        if (nav === 'secrets') {
          const link = isSecrets ? 'index.html' : basePath + 'sharm-secrets/index.html';
          window.location.href = link;
          return;
        }
      });
    }
    langDd.addEventListener('click', (e) => {
      const btn = e.target.closest('.gh-lang-item');
      if (!btn) return;
      const newLang = btn.getAttribute('data-lang');
      localStorage.setItem('fabio_lang', newLang);
      localStorage.setItem('preferredLanguage', newLang);
      document.documentElement.lang = newLang;
      if (typeof applyTranslations === 'function') {
        applyTranslations(newLang);
      } else {
        GlobalHeader.initLanguage();
        window.dispatchEvent(new CustomEvent('langChanged', { detail: { lang: newLang } }));
      }
      if (typeof window.renderLegal === 'function') {
        try { window.renderLegal(newLang); } catch (err) { /* noop */ }
      }
      // Update flag button instantly
      if (langBtn) {
        langBtn.innerHTML = `${flagSvg(newLang)}<span class="gh-chevron">▼</span>`;
      }
      // Update dropdown active state
      langDd.querySelectorAll('.gh-lang-item').forEach(item => item.classList.remove('active'));
      const activeItem = langDd.querySelector(`.gh-lang-item[data-lang="${newLang}"]`);
      if (activeItem) activeItem.classList.add('active');
    });
    // center navigation handled via gh-nav-inline

    const setActiveNav = (key) => {
      if (!navInline) return;
      navInline.querySelectorAll('a').forEach(a => a.classList.remove('active'));
      const el = navInline.querySelector(`a[data-nav="${key}"]`);
      if (el) el.classList.add('active');
    };
    const sectionMap = [
      { selector: '#hero-slider-section', key: 'home', i18nKey: 'menu.home' },
      { selector: '#trips-grid', key: 'trips', i18nKey: 'menu.trips' },
      { selector: '#reviews', key: 'reviews', i18nKey: 'menu.reviews' }
    ];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const found = sectionMap.find(s => entry.target.matches(s.selector));
          if (found) setActiveNav(found.key);
        }
      });
    }, { threshold: [0.5] });
    sectionMap.forEach(s => {
      const el = document.querySelector(s.selector);
      if (el) observer.observe(el);
    });
    if (isSecrets) setActiveNav('secrets');

    const updateProgress = () => {
      if (!progressBar) return;
      const max = document.body.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      progressBar.style.width = pct + '%';
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    if (!document.querySelector('.floating-whatsapp')) {
      const w = document.createElement('div');
      w.id = 'whatsapp-float';
      w.className = 'fab-base floating-whatsapp';
      w.innerHTML = `
        <span class="floating-whatsapp-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" class="floating-whatsapp-svg">
            <path d="M16 3C9.4 3 4.1 8.1 4.1 14.6c0 2.5.8 4.8 2.3 6.8L5 27.5l6.3-1.9c1.8 1 3.8 1.5 5.8 1.5 6.6 0 11.9-5.1 11.9-11.6C29 8.1 22.6 3 16 3zm0 2.3c5.3 0 9.6 4.1 9.6 9.3 0 5.1-4.3 9.3-9.6 9.3-1.8 0-3.5-.5-5-1.3l-.4-.2-3.7 1.1 1.1-3.5-.2-.4c-1.2-1.5-1.8-3.3-1.8-5.1C6 9.4 10.3 5.3 16 5.3zm-3.4 4c-.3 0-.7.1-1 .1-.3.1-.8.4-.9.9-.2.5-.5 1.5-.5 1.7 0 .2-.1 .6 .3 1.1 .4 .5 1.1 1.7 2.4 2.8 1.3 1.2 2.9 1.9 3.4 2.1 .5 .2 1 .2 1.3 .1 .4 -.1 1.3 -.6 1.5 -1.1 .2 -.5 .2 -1 .2 -1.1 s-.1 -.3 -.3 -.4 c-.2 -.1 -1.3 -.6 -1.5 -.7 -.2 -.1 -.4 -.1 -.6 .1 -.2 .3 -.7 .8 -.9 1 -.2 .1 -.4 .1 -.6 0 -.2 -.1 -.9 -.3 -1.7 -1 -.6 -.6 -1 -1.3 -1.2 -1.5 -.1 -.3 0 -.5 .1 -.6 .1 -.1 .2 -.2 .3 -.4 .1 -.1 .1 -.3 0 -.4 -.1 -.1 -.9 -2.3 -1.1 -2.6 -.1 -.3 -.3 -.3 -.4 -.3 z"></path>
          </svg>
        </span>
      `;
      w.addEventListener('click', () => window.open('https://wa.me/201063239261', '_blank'));
      document.body.appendChild(w);
      const wl = document.createElement('div');
      wl.className = 'wa-fab-label';
      wl.setAttribute('data-i18n', 'fab.contact');
      document.body.appendChild(wl);
      GlobalHeader.initLanguage();
    }

    const banner = document.getElementById('promo-banner-container');
    if (banner) {
      banner.style.marginTop = host.offsetHeight + 'px';
    }

    if (isSecrets) {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="gh-fab-label" data-i18n="fab.indice"></div>
        <button class="fab-base gh-fab" id="gh-fab" aria-label="">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="#111">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.5 6.5l-2 5-5 2 2-5 5-2z"/>
          </svg>
        </button>
      `;
      const labelEl = container.firstElementChild;
      const btnEl = container.lastElementChild;
      document.body.appendChild(labelEl);
      document.body.appendChild(btnEl);
      const activeLang = GlobalHeader.initLanguage();
      const dict = activeLang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
      const indexLabel = dict && dict.fab && typeof dict.fab.indice === 'string'
        ? dict.fab.indice
        : (activeLang === 'en' ? 'Index' : 'Indice');
      btnEl.setAttribute('aria-label', indexLabel);
      btnEl.addEventListener('click', () => {
        const menu = document.getElementById('indexMenu');
        if (typeof showIndexMenu === 'function') {
          showIndexMenu();
        } else if (menu) {
          menu.classList.add('is-visible');
        }
      });
      const menu = document.getElementById('indexMenu');
      if (menu) {
        const closeBtn = menu.querySelector('.index-menu-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            menu.classList.remove('is-visible');
          });
        }
        menu.addEventListener('click', (e) => {
          if (!e.target.closest('.index-menu-inner')) {
            menu.classList.remove('is-visible');
          }
        });
      }
    }
  }
};
// Ensure header and translations are initialized as early as possible to avoid visible text flicker
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', GlobalHeader.init);
} else {
  GlobalHeader.init();
}
window.GlobalHeader = GlobalHeader;
