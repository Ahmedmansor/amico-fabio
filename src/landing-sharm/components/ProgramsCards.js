// src/landing-sharm/components/ProgramsCards.js

/**
 * "I nostri programmi di viaggio" — 4 destination cards.
 * White cards with soft shadows, rounded corners, no harsh borders.
 */
const ProgramsCards = {
  init: () => {
    const host = document.getElementById('programs-section');
    if (!host) return;

    const destinations = [
      {
        name: 'Il Cairo',
        desc: 'Piramidi di Giza, Museo Egizio, Cairo Antico e bazar tradizionali.',
        img: '../assets/images/destinations/cairo.webp',
        link: '#'
      },
      {
        name: 'Sharm El Sheikh',
        desc: 'Mare cristallino, coralli spettacolari, relax e divertimento.',
        img: '../assets/images/destinations/sharm.webp',
        link: '#'
      },
      {
        name: 'Marsa Alam',
        desc: 'Spiagge incontaminate, barriera corallina e natura mozzafiato.',
        img: '../assets/images/destinations/marsa-alam.webp',
        link: '#'
      },
      {
        name: 'Luxor e Aswan',
        desc: 'Templi maestosi, Valle dei Re, crociere sul Nilo e storia senza tempo.',
        img: '../assets/images/destinations/luxor.webp',
        link: '#'
      }
    ];

    const arrowSvg = `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

    host.innerHTML = `
      <section class="osh-section" id="programs-cards">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">I nostri programmi di viaggio</h2>
          </div>
          <div class="osh-programs-grid">
            ${destinations.map(d => `
              <article class="osh-program-card">
                <img class="osh-program-img" src="${d.img}" alt="${d.name}" loading="lazy" />
                <div class="osh-program-body">
                  <h3 class="osh-program-name">${d.name}</h3>
                  <p class="osh-program-desc">${d.desc}</p>
                  <a class="osh-program-link" href="${d.link}">Scopri di più ${arrowSvg}</a>
                </div>
              </article>
            `).join('')}
          </div>
          <div class="osh-programs-cta">
            <a href="#booking-section" class="osh-btn osh-btn--gold-outline" id="programs-cta-btn">
              Scopri tutti i nostri viaggi
            </a>
          </div>
        </div>
      </section>
    `;

    // Smooth scroll for CTA
    const ctaBtn = document.getElementById('programs-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById('booking-section');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
};

export default ProgramsCards;
