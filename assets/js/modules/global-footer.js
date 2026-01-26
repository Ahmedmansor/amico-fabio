const GlobalFooter = {
  init: () => {
    const host = document.getElementById('global-footer');
    if (!host) return;

    // Helper to safely get paths from ImagePaths
    const getPath = (key) => {
      if (!window.ImagePaths) return '';
      const parts = key.split('.');
      let val = window.ImagePaths;
      for (const p of parts) {
        val = val && val[p];
      }
      return typeof val === 'string' ? val : '';
    };

    const isSecrets = /\/sharm-secrets\//i.test(window.location.pathname);
    const basePath = isSecrets ? '../' : '';
    const __parts = (typeof window !== 'undefined' && window.location && window.location.pathname ? window.location.pathname.split('/') : []);
    const __repo = __parts.filter(Boolean)[0] || '';
    const __fallbackBase = __repo ? `/${__repo}/` : '/';
    const __BASE = (typeof window !== 'undefined' && window.FABIO_BASE_URL) || __fallbackBase;
    const lang = localStorage.getItem('fabio_lang') || localStorage.getItem('preferredLanguage') || document.documentElement.lang || 'it';
    const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const year = new Date().getFullYear();
    const aboutBio = i18n.footer && i18n.footer.about_bio ? i18n.footer.about_bio : '';
    const linksLegal = i18n.footer && i18n.footer.links_legal ? i18n.footer.links_legal : '';
    const linksWhy = (i18n.footer && i18n.footer.links_why) ? i18n.footer.links_why : (i18n.global && i18n.global.why_fabio ? i18n.global.why_fabio : '');
    const joinCommunity = i18n.footer && i18n.footer.join_community ? i18n.footer.join_community : '';
    const heritage = i18n.footer && i18n.footer.heritage ? i18n.footer.heritage : '';
    const brandSubtitle = (i18n.global && i18n.global.brand_subtitle) ? i18n.global.brand_subtitle : (lang === 'en' ? 'Official Tour Guide' : 'Guida Turistica Ufficiale');

    // Resolve paths
    const headerLogo = getPath('ui.headerLogo') || (`${__BASE}assets/images/logo/fabio-header-logo.webp`);
    const crossRootsLogo = getPath('ui.crossRootsLogo') || (`${__BASE}assets/images/logo/cross-roots-logo.webp`);
    const facebookIcon = getPath('icons.social.facebook') || (`${__BASE}assets/images/icons/social/facebook.svg`);
    const instagramIcon = getPath('icons.social.instagram') || (`${__BASE}assets/images/icons/social/instagram.svg`);

    const markup = `
      <footer class="af-footer">
        <div class="af-footer-inner">
          <div class="af-grid">
            <div class="af-col af-about">
              <div class="af-logo-wrap">
                <img src="${headerLogo}" alt="FABIO" class="af-logo" width="84" height="81" loading="lazy">
                <div class="af-brand">
                  <div class="af-brand-title">FABIO</div>
                  <div class="af-brand-subtitle" data-i18n="global.brand_subtitle">${brandSubtitle}</div>
                </div>
              </div>
              <p class="af-bio" data-i18n="footer.about_bio">${aboutBio}</p>
              <p class="af-copy">&copy; 2025 - ${year}</p>
            </div>
            <div class="af-col af-links">
              <h4 class="af-heading">Links</h4>
              <nav class="af-links-nav">
                <a href="${basePath}legal.html" class="af-link" data-i18n="footer.links_legal">${linksLegal}</a>
                <a href="${isSecrets ? 'index.html#page6' : basePath + 'sharm-secrets/index.html#page6'}" class="af-link" data-i18n="global.why_fabio">${linksWhy}</a>
              </nav>
            </div>
            <div class="af-col af-community">
              <h4 class="af-heading" data-i18n="footer.join_community">${joinCommunity}</h4>
              <div class="af-social">
                <a href="https://www.facebook.com/groups/762287932356507" target="_blank" rel="noopener" aria-label="Facebook" class="af-social-btn">
                  <img src="${facebookIcon}" class="af-social-icon" width="24" height="24" alt="Facebook">
                </a>
                <a href="https://www.instagram.com/fabio_sharm_el_sheikh_/" target="_blank" rel="noopener" aria-label="Instagram" class="af-social-btn">
                  <img src="${instagramIcon}" class="af-social-icon" width="24" height="24" alt="Instagram">
                </a>
              </div>
            </div>
          </div>
          <div class="af-legacy">
            <img src="${crossRootsLogo}" alt="Cross Roots Logo" class="af-legacy-logo" width="75" height="50" loading="lazy">
            <span class="af-legacy-text" data-i18n="footer.heritage">${heritage}</span>
          </div>
        </div>
      </footer>
    `;
    host.innerHTML = markup.trim();
  }
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', GlobalFooter.init);
} else {
  GlobalFooter.init();
}
window.GlobalFooter = GlobalFooter;
