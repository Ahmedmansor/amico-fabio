// src/landing-sharm/components/ProgramsCards.js

/**
 * "I nostri programmi di viaggio" — 5 destination cards.
 * Clean, isolated ES6 module rendering destinations with image, title, and description.
 */

const programsData = [
  {
    title: "Il Cairo",
    description: "Scopri i segreti dei Faraoni con la tua guida privata parlante italiano. Un viaggio esclusivo tra le Piramidi, storia millenaria e comfort assoluto, curato in ogni dettaglio.",
    image: "/assets/images/offerta-sharm-land-page/distinations/cairo.webp"
  },
  {
    title: "Sharm El Sheikh",
    description: "Lusso senza compromessi e vere esperienze VIP sul Mar Rosso. Escursioni private in barca, snorkeling esclusivo e relax totale lontano dal turismo di massa.",
    image: "/assets/images/offerta-sharm-land-page/distinations/sharm.webp"
  },
  {
    title: "Dahab",
    description: "La città magica, atmosfera bohémien, snorkeling e barriere coralline uniche.",
    image: "/assets/images/offerta-sharm-land-page/distinations/dahab.webp"
  },
  {
    title: "Monte Sinai e Santa Caterina",
    description: "Un'avventura mistica nel cuore del deserto vissuta in totale privacy. Ammira un'alba mozzafiato con un'organizzazione impeccabile e servizi su misura.",
    image: "/assets/images/offerta-sharm-land-page/distinations/saint_catherine.webp"
  },
  {
    title: "Luxor e Aswan",
    description: "Naviga nella storia e visita i templi più maestosi d'Egitto. Un'esperienza culturale Premium con un servizio personalizzato, pensato esclusivamente per te.",
    image: "/assets/images/offerta-sharm-land-page/distinations/luxor_aswan.webp"
  },
  {
    title: "Siwa",
    description: "Un'oasi di pura magia nel cuore del deserto. Immergiti nelle surreali piscine di sale, esplora antiche rovine e concediti un ritiro eco-chic all'insegna del relax assoluto.",
    image: "/assets/images/offerta-sharm-land-page/distinations/siwa.webp"
  },
  {
    title: "Marsa Alam",
    description: "Il paradiso incontaminato del Mar Rosso. Nuota tra tartarughe e delfini in barriere coralline intatte, vivendo un'avventura marina esclusiva e lontana dal turismo di massa.",
    image: "/assets/images/offerta-sharm-land-page/distinations/marsa_alam.webp"
  },
  {
    title: "Marsa Matrouh",
    description: "Scopri le \"Maldive del Mediterraneo\". Spiagge di sabbia bianca finissima, acque turchesi cristalline e un'atmosfera di puro relax per una fuga esclusiva e indimenticabile.",
    image: "/assets/images/offerta-sharm-land-page/distinations/marsa_matrouh.webp"
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
