// src/landing-sharm/components/ProgramsCards.js

/**
 * "I nostri programmi di viaggio" — 5 destination cards.
 * Clean, isolated ES6 module rendering destinations with image, title, and description.
 */

const programsData = [
  {
    title: "Il Cairo",
    description: "Piramidi di Giza, Museo Egizio, Cairo Antico e bazar tradizionali.",
    image: "/assets/images/offerta-sharm-land-page/distinations/cairo.webp"
  },
  {
    title: "Sharm El Sheikh",
    description: "Mare cristallino, coralli spettacolari, relax e divertimento.",
    image: "/assets/images/offerta-sharm-land-page/distinations/sharm.webp"
  },
  {
    title: "Dahab",
    description: "La città magica, atmosfera bohémien, snorkeling e barriere coralline uniche.",
    image: "/assets/images/offerta-sharm-land-page/distinations/dahab.webp"
  },
  {
    title: "Monte Sinai e Santa Caterina",
    description: "Un'alba mozzafiato dalla vetta del Monte Sinai e il monastero più antico del mondo.",
    image: "/assets/images/offerta-sharm-land-page/distinations/saint_catherine.webp"
  },
  {
    title: "Luxor e Aswan",
    description: "Templi maestosi, Valle dei Re, crociere sul Nilo e storia senza tempo.",
    image: "/assets/images/offerta-sharm-land-page/distinations/luxor_aswan.webp"
  }
];

export const initProgramsCards = (containerId = 'programs-section') => {
  const host = document.getElementById(containerId);
  if (!host) return;

  host.innerHTML = `
    <section class="osh-section" id="programs-cards">
      <div class="osh-container">
        <div class="osh-section-header">
          <h2 class="osh-section-title">I nostri programmi di viaggio</h2>
          <p class="osh-section-subtitle">Scopri le destinazioni più affascinanti dell'Egitto con le nostre guide esperte</p>
        </div>
        <div class="osh-programs-grid">
          ${programsData.map(item => `
            <article class="osh-program-card">
              <img class="osh-program-img" src="${item.image}" alt="${item.title}" loading="lazy" decoding="async" />
              <div class="osh-program-body">
                <h3 class="osh-program-name">${item.title}</h3>
                <p class="osh-program-desc">${item.description}</p>
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
};

const ProgramsCards = {
  init: initProgramsCards
};

export default ProgramsCards;
