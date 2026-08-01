// src/landing-sharm/components/WhyChooseUs.js

/**
 * "Perché scegliere Fabio Egypt?" — 4 feature columns with inline SVG icons.
 */
const WhyChooseUs = {
  init: () => {
    const host = document.getElementById('why-section');
    if (!host) return;

    const features = [
      {
        title: 'Supporto in Italiano 24/7',
        desc: 'Assistenza dedicata nella tua lingua, prima, durante e dopo il viaggio.',
        icon: `<svg viewBox="0 0 24 24"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>`
      },
      {
        title: 'Assistenza diretta in Egitto',
        desc: 'Operativi sul territorio per offrirti il meglio e garantirti sicurezza.',
        icon: `<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
      },
      {
        title: 'Tour su misura e prezzi trasparenti',
        desc: 'Esperienze personalizzate con cura per ogni dettaglio, senza costi nascosti.',
        icon: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
      },
      {
        title: 'Accoglienza personale al tuo arrivo',
        desc: 'Saremo lì per accoglierti e accompagnarti nel tuo viaggio.',
        icon: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
      }
    ];

    host.innerHTML = `
      <section class="osh-section osh-section--alt" id="why-choose">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">Perché scegliere Fabio Egypt?</h2>
          </div>
          <div class="osh-why-grid">
            ${features.map(f => `
              <div class="osh-why-item">
                <div class="osh-why-icon">${f.icon}</div>
                <h3 class="osh-why-title">${f.title}</h3>
                <p class="osh-why-desc">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }
};

export default WhyChooseUs;
