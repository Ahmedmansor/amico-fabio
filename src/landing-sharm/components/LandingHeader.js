// src/landing-sharm/components/LandingHeader.js

const LandingHeader = {
  init: () => {
    const host = document.getElementById('landing-header');
    if (!host) return;

    // Why: Use relative path from /offerta-sharm/ back to root assets
    const logoSrc = '../assets/images/logo/fabio-header-logo.webp';

    host.innerHTML = `
      <header class="lsh-header">
        <div class="lsh-header-inner">
          <img src="${logoSrc}" alt="Fabio Egypt" class="lsh-header-logo" width="50" height="48" />
          <div class="lsh-header-brand">
            <span class="lsh-header-title">FABIO</span>
            <span class="lsh-header-subtitle">Guida Turistica Ufficiale</span>
          </div>
        </div>
      </header>
    `;
  }
};

export default LandingHeader;
