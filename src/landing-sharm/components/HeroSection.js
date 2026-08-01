// src/landing-sharm/components/HeroSection.js

const HeroSection = {
  init: () => {
    const host = document.getElementById('hero-section');
    if (!host) return;

    host.innerHTML = `
      <section class="osh-hero" id="osh-hero">
        <div class="osh-hero-bg">
          <img src="../assets/images/offerta-sharm-land-page/offerta-sharm-land-page-hero.webp"
               alt="Offerta Sharm El Sheikh — Fabio Egypt"
               loading="eager"
               fetchpriority="high" />
          <div class="osh-hero-overlay"></div>
        </div>

        <div class="osh-hero-content">
          <h1 class="osh-hero-title">L'Egitto ti aspetta</h1>
          <p class="osh-hero-subtitle">
            Tour personalizzati, assistenza in italiano<br>
            e accoglienza al tuo arrivo.
          </p>
          <div class="osh-hero-actions">
            <a href="https://wa.me/201063239261?text=${encodeURIComponent('Ciao Fabio! Sono interessato/a ai vostri tour in Egitto. Vorrei maggiori informazioni. Grazie!')}"
               class="osh-btn osh-btn--wa" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347ZM12.05 21.785h-.01a9.86 9.86 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.86 9.86 0 0 1 2.16 12.04C2.162 6.584 6.59 2.16 12.055 2.16c1.87 0 3.66.502 5.225 1.45a9.84 9.84 0 0 1 1.77 1.447 9.84 9.84 0 0 1 2.893 7.003c-.003 5.456-4.432 9.88-9.893 9.88v-.155Z"/>
              </svg>
              Contattaci su WhatsApp
            </a>
            <a href="#booking-section" class="osh-btn osh-btn--outline" id="hero-discover-btn">
              Scopri le destinazioni
            </a>
          </div>
        </div>

        <!-- Speech bubble — visible on tablet+ via CSS -->
        <div class="osh-hero-bubble">
          Hai domande?<br>Siamo qui per te!
        </div>
      </section>
    `;

    // Smooth scroll for "Scopri le destinazioni"
    const discoverBtn = document.getElementById('hero-discover-btn');
    if (discoverBtn) {
      discoverBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById('booking-section');
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
};

export default HeroSection;
