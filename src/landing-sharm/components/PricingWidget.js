// src/landing-sharm/components/PricingWidget.js

const PricingWidget = {
  init: () => {
    const host = document.getElementById('pricing-section');
    if (!host) return;

    host.innerHTML = `
      <section class="lsh-section lsh-pricing">
        <div class="lsh-section-inner">
          <div class="lsh-section-header">
            <h2 class="lsh-section-title">Il Prezzo</h2>
            <p class="lsh-section-subtitle">Trasparenza totale, zero sorprese</p>
            <hr class="lsh-gold-divider" />
          </div>

          <div class="lsh-pricing-card">
            <p class="lsh-pricing-label">A partire da</p>
            <div class="lsh-pricing-amount">€199</div>
            <p class="lsh-pricing-suffix">a persona</p>
            <p class="lsh-pricing-note">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Il prezzo include trasferimenti privati, guida italiana e tutte le escursioni indicate nel programma.
            </p>
            <button class="lsh-pricing-cta" id="pricing-cta-btn" type="button">
              Prenota il Tuo Posto
            </button>
          </div>
        </div>
      </section>
    `;

    // Smooth scroll to booking section
    const ctaBtn = document.getElementById('pricing-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
};

export default PricingWidget;
