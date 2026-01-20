const GlobalFooter = {
  init: () => {
    const host = document.getElementById('global-footer');
    if (!host) return;
    const isSecrets = /\/sharm-secrets\//i.test(window.location.pathname);
    const basePath = isSecrets ? '../' : '';
    const lang = localStorage.getItem('fabio_lang') || localStorage.getItem('preferredLanguage') || document.documentElement.lang || 'it';
    const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
    const year = new Date().getFullYear();
    const aboutBio = i18n.footer && i18n.footer.about_bio ? i18n.footer.about_bio : '';
    const linksLegal = i18n.footer && i18n.footer.links_legal ? i18n.footer.links_legal : '';
    const linksWhy = (i18n.footer && i18n.footer.links_why) ? i18n.footer.links_why : (i18n.global && i18n.global.why_fabio ? i18n.global.why_fabio : '');
    const joinCommunity = i18n.footer && i18n.footer.join_community ? i18n.footer.join_community : '';
    const heritage = i18n.footer && i18n.footer.heritage ? i18n.footer.heritage : '';
    const brandSubtitle = (i18n.global && i18n.global.brand_subtitle) ? i18n.global.brand_subtitle : (lang === 'en' ? 'Official Tour Guide' : 'Guida Turistica Ufficiale');
    const markup = `
      <footer class="af-footer">
        <div class="af-footer-inner">
          <div class="af-grid">
            <div class="af-col af-about">
              <div class="af-logo-wrap">
                <img src="${window.ImagePaths ? window.ImagePaths.ui.headerLogo : basePath + 'assets/images/logo/fabio-header-logo.webp'}" alt="FABIO" class="af-logo" width="84" height="81" loading="lazy">
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
                <a href="#" aria-label="Facebook" class="af-social-btn">
                  <svg viewBox="0 0 24 24" class="af-social-icon"><path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.3l-.4 3h-1.9v7A10 10 0 0022 12z"/></svg>
                </a>
                <a href="#" aria-label="Instagram" class="af-social-btn">
                  <svg viewBox="0 0 24 24" class="af-social-icon"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.9.2 2.3.4.6.2 1 .5 1.5 1 .5.5.8.9 1 1.5.2.4.3 1.1.4 2.3.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.9-.4 2.3-.2.6-.5 1-1 1.5-.5.5-.9.8-1.5 1-.4.2-1.1.3-2.3.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.5-1.5-1-.5-.5-.8-.9-1-1.5-.2-.4-.3-1.1-.4-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.9.4-2.3.2-.6.5-1 1-1.5.5-.5.9-.8 1.5-1 .4-.2 1.1-.3 2.3-.4C8.4 2.2 8.8 2.2 12 2.2zm0 2c-3.1 0-3.4 0-4.6.1-1 .1-1.5.2-1.9.3-.5.2-.8.4-1.1.8-.3.3-.6.6-.8 1.1-.1.4-.3.9-.3 1.9-.1 1.2-.1 1.5-.1 4.6s0 3.4.1 4.6c.1 1 .2 1.5.3 1.9.2.5.4.8.8 1.1.3.3.6.6 1.1.8.4.1.9.3 1.9.3 1.2.1 1.5.1 4.6.1s3.4 0 4.6-.1c1-.1 1.5-.2 1.9-.3.5-.2.8-.4 1.1-.8.3-.3.6-.6.8-1.1.1-.4.3-.9.3-1.9.1-1.2.1-1.5.1-4.6s0-3.4-.1-4.6c-.1-1-.2-1.5-.3-1.9-.2-.5-.4-.8-.8-1.1-.3-.3-.6-.6-1.1-.8-.4-.1-.9-.3-1.9-.3-1.2-.1-1.5-.1-4.6-.1zm0 3.6a4.2 4.2 0 110 8.4 4.2 4.2 0 010-8.4zm6.5-2.1a1 1 0 110 2 1 1 0 010-2z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div class="af-legacy">
            <img src="${window.ImagePaths ? window.ImagePaths.ui.crossRootsLogo : basePath + 'assets/images/logo/cross-roots-logo.webp'}" alt="Cross Roots Logo" class="af-legacy-logo" width="75" height="50" loading="lazy">
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
