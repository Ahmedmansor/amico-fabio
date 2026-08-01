// src/landing-sharm/components/TrustBadges.js

/**
 * Dark Navy Blue pre-footer section with 5 trust badge columns.
 */
const TrustBadges = {
  init: () => {
    const host = document.getElementById('trust-section');
    if (!host) return;

    const badges = [
      {
        title: 'Sede in Egitto',
        desc: 'Operativi sul territorio per offrirti i migliori servizi in Egitto.',
        icon: `<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
      },
      {
        title: 'Supporto in Italiano',
        desc: 'Assistenza dedicata durante il tuo viaggio in Egitto.',
        icon: `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
      },
      {
        title: 'Sicurezza e Affidabilità',
        desc: 'Servizi con licenza turistica del Ministero del Turismo Egiziano.',
        icon: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
      },
      {
        title: 'Prenotazioni Sicure',
        desc: 'I tuoi dati sono protetti e le transazioni sono sempre sicure.',
        icon: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
      },
      {
        title: 'WhatsApp Sempre Attivo',
        desc: 'Scrivici quando vuoi, saremo sempre qui!',
        icon: `<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
      }
    ];

    host.innerHTML = `
      <section class="osh-trust" id="trust-block">
        <div class="osh-trust-grid">
          ${badges.map(b => `
            <div class="osh-trust-item">
              <div class="osh-trust-icon">${b.icon}</div>
              <div class="osh-trust-text">
                <p class="osh-trust-text-title">${b.title}</p>
                <p class="osh-trust-text-desc">${b.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }
};

export default TrustBadges;
