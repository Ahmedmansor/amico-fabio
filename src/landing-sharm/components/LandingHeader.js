// src/landing-sharm/components/LandingHeader.js

const LandingHeader = {
  init: () => {
    const host = document.getElementById('landing-header');
    if (!host) return;

    host.innerHTML = `
      <header class="osh-header" id="osh-main-header">
        <div class="osh-header-inner">
          <a href="/offerta-sharm/" class="osh-header-logo-wrap" aria-label="Fabio Egypt Home">
            <img class="osh-header-logo"
                 src="../assets/images/logo/logo-fabio-square.webp"
                 alt="Fabio Egypt Logo"
                 width="42" height="40" loading="eager" decoding="async" />
            <div class="osh-header-brand">
              <span class="osh-header-brand-name">Fabio <span>Egypt</span></span>
            </div>
          </a>

          <button class="osh-hamburger" id="osh-hamburger-btn" aria-label="Apri menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      <!-- Mobile Overlay -->
      <div class="osh-menu-overlay" id="osh-menu-overlay"></div>

      <!-- Mobile Slide-Out Menu -->
      <nav class="osh-mobile-menu" id="osh-mobile-menu" aria-label="Menu principale">
        <button class="osh-mobile-menu-close" id="osh-menu-close" aria-label="Chiudi menu">&times;</button>
        <div class="osh-mobile-menu-nav">
          <a href="#why-section">Perché noi</a>
          <a href="#programs-section">Destinazioni</a>
          <a href="#timeline-section">Come prenotare</a>
          <a href="#videos-section">Testimonianze</a>
          <a href="#booking-section">Prenota ora</a>
        </div>
      </nav>
    `;

    LandingHeader._bindMenu();
  },

  _bindMenu: () => {
    const hamburger = document.getElementById('osh-hamburger-btn');
    const menu = document.getElementById('osh-mobile-menu');
    const overlay = document.getElementById('osh-menu-overlay');
    const closeBtn = document.getElementById('osh-menu-close');

    if (!hamburger || !menu || !overlay || !closeBtn) return;

    const open = () => {
      menu.classList.add('is-open');
      overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    };

    const close = () => {
      menu.classList.remove('is-open');
      overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    // Close on menu link click + smooth scroll
    menu.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        close();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
        }
      });
    });
  }
};

export default LandingHeader;
