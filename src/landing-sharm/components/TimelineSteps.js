// src/landing-sharm/components/TimelineSteps.js

/**
 * "Come prenotare il tuo viaggio" — 4 steps with numbered icons
 * connected by a dashed horizontal line on desktop.
 */
const TimelineSteps = {
  init: () => {
    const host = document.getElementById('timeline-section');
    if (!host) return;

    const steps = [
      {
        num: 1,
        title: 'Contattaci su WhatsApp',
        desc: 'Scrivici in qualsiasi momento, siamo qui per te!',
        icon: `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
      },
      {
        num: 2,
        title: 'Scegli la destinazione',
        desc: 'Raccontaci dove vuoi andare e cosa desideri vivere.',
        icon: `<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`
      },
      {
        num: 3,
        title: 'Conferma la data di arrivo',
        desc: 'Organizziamo tutto in base ai tuoi voli e ai tuoi orari.',
        icon: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
      },
      {
        num: 4,
        title: 'Ti aspettiamo al tuo arrivo',
        desc: 'Saremo lì per accoglierti e accompagnarti nel tuo viaggio.',
        icon: `<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
      }
    ];

    host.innerHTML = `
      <section class="osh-section osh-section--alt" id="timeline-block">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">Come prenotare il tuo viaggio</h2>
          </div>
          <div class="osh-timeline">
            ${steps.map(s => `
              <div class="osh-timeline-step">
                <div class="osh-timeline-icon-wrap">
                  <span class="osh-timeline-number">${s.num}</span>
                  ${s.icon}
                  <div class="osh-timeline-line"></div>
                </div>
                <h3 class="osh-timeline-title">${s.title}</h3>
                <p class="osh-timeline-desc">${s.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }
};

export default TimelineSteps;
