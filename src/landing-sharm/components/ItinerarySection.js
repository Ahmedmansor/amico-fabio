// src/landing-sharm/components/ItinerarySection.js

const ItinerarySection = {
  // Why: Itinerary data kept as a static array for easy future replacement with dynamic data.
  _items: [
    {
      day: 'Giorno 1',
      title: 'Arrivo a Sharm El Sheikh',
      desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Accoglienza privata in aeroporto e trasferimento VIP al vostro resort.'
    },
    {
      day: 'Giorno 2',
      title: 'Ras Mohammed — Snorkeling VIP',
      desc: 'Praesent euismod velit non arcu dignissim, sed tincidunt lorem consequat. Escursione in barca privata con pranzo incluso.'
    },
    {
      day: 'Giorno 3',
      title: 'Safari nel Deserto & Cena Beduina',
      desc: 'Fusce vehicula ligula at elit fermentum, vitae ultricies neque malesuada. Quad, cammelli e cena sotto le stelle.'
    },
    {
      day: 'Giorno 4',
      title: 'Giornata Libera & Relax',
      desc: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium. Tempo libero per godervi il resort e il mare.'
    },
    {
      day: 'Giorno 5',
      title: 'Partenza & Arrivederci',
      desc: 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur. Trasferimento privato in aeroporto e saluto personalizzato.'
    }
  ],

  init: () => {
    const host = document.getElementById('itinerary-section');
    if (!host) return;

    const cardsHtml = ItinerarySection._items.map((item, index) => `
      <article class="lsh-itinerary-card lsh-reveal">
        <div class="lsh-itinerary-number">${index + 1}</div>
        <div class="lsh-itinerary-body">
          <span class="lsh-itinerary-day">${item.day}</span>
          <h3 class="lsh-itinerary-title">${item.title}</h3>
          <p class="lsh-itinerary-desc">${item.desc}</p>
        </div>
      </article>
    `).join('');

    host.innerHTML = `
      <section class="lsh-section">
        <div class="lsh-section-inner">
          <div class="lsh-section-header">
            <h2 class="lsh-section-title">Il Tuo Itinerario</h2>
            <p class="lsh-section-subtitle">Lorem ipsum dolor sit amet</p>
            <hr class="lsh-gold-divider" />
          </div>
          <div class="lsh-itinerary-grid">
            ${cardsHtml}
          </div>
        </div>
      </section>
    `;

    // Scroll-reveal animation using IntersectionObserver
    ItinerarySection._observeReveal(host);
  },

  _observeReveal: (root) => {
    const reveals = root.querySelectorAll('.lsh-reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach((el) => observer.observe(el));
  }
};

export default ItinerarySection;
