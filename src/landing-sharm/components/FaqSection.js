// src/landing-sharm/components/FaqSection.js

/**
 * "Domande Frequenti" — Modern, Interactive Accordion FAQ Widget.
 * Clean, isolated ES6 module with accessible accordion behavior, smooth transitions,
 * and high-converting clarity for Italian travelers.
 */

const faqData = [
  {
    id: "faq-1",
    question: "Serve il visto per Sharm El Sheikh?",
    answer: "Se il tuo viaggio si svolge esclusivamente a Sharm El Sheikh, non hai bisogno di acquistare il visto turistico (è sufficiente il timbro gratuito \"Sinai Only\" valido per 15 giorni). Tuttavia, se il tuo programma include escursioni affascinanti come Il Cairo o Luxor, il visto è obbligatorio. In ogni caso, il team di Fabio Egypt ti assisterà per rendere ogni procedura semplice e veloce."
  },
  {
    id: "faq-2",
    question: "Le guide parlano italiano fluente?",
    answer: "Assolutamente sì! Tutti i nostri collaboratori sono guide turistiche ufficiali e certificate dal Ministero del Turismo Egiziano. Oltre ad avere una profonda conoscenza storica e culturale, parlano un italiano eccellente. Vogliamo garantirti un'esperienza coinvolgente, chiara e senza alcuna barriera linguistica."
  },
  {
    id: "faq-3",
    question: "Come funziona il pagamento?",
    answer: "Offriamo la massima flessibilità per farti viaggiare senza stress. L'opzione più semplice e da noi consigliata è il saldo in contanti (in Euro) comodamente al tuo arrivo in Egitto. Tuttavia, se preferisci non viaggiare con contanti, puoi pagare in totale sicurezza con la tua carta di credito (Visa/Mastercard). Il nostro obiettivo è il tuo comfort, fin dal primo momento."
  },
  {
    id: "faq-4",
    question: "Cosa succede se il volo è in ritardo?",
    answer: "Non devi preoccuparti di nulla. Il nostro team monitora costantemente lo stato del tuo volo in tempo reale tramite sistemi di tracciamento (Flight Radar). In caso di ritardo, il tuo autista privato adatterà automaticamente l'orario e saranno lì in aeroporto ad aspettarti al tuo arrivo, senza alcun costo aggiuntivo."
  }
];

const chevronSvg = `
  <svg class="osh-faq-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
`;

export const initFaqSection = (containerId = 'faq-section') => {
  const host = document.getElementById(containerId);
  if (!host) return;

  host.innerHTML = `
    <section class="osh-section osh-section--alt" id="faq-block">
      <div class="osh-container osh-faq-container">
        <div class="osh-section-header">
          <h2 class="osh-section-title">Domande Frequenti</h2>
          <p class="osh-section-subtitle">Tutto quello che devi sapere prima di partire per la tua vacanza in Egitto</p>
        </div>

        <div class="osh-faq-list" role="region" aria-label="Domande Frequenti">
          ${faqData.map((item, index) => `
            <div class="osh-faq-item ${index === 0 ? 'is-open' : ''}" id="faq-item-${item.id}">
              <button type="button" 
                      class="osh-faq-question" 
                      aria-expanded="${index === 0 ? 'true' : 'false'}"
                      aria-controls="faq-ans-${item.id}"
                      id="faq-btn-${item.id}">
                <span class="osh-faq-q-text">${item.question}</span>
                <span class="osh-faq-icon-wrap">${chevronSvg}</span>
              </button>
              <div class="osh-faq-answer" 
                   id="faq-ans-${item.id}" 
                   role="region" 
                   aria-labelledby="faq-btn-${item.id}">
                <div class="osh-faq-answer-inner">
                  <p>${item.answer}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  FaqSection._bindAccordion();
};

const FaqSection = {
  init: initFaqSection,

  _bindAccordion: () => {
    const items = document.querySelectorAll('.osh-faq-item');
    if (!items.length) return;

    items.forEach(item => {
      const btn = item.querySelector('.osh-faq-question');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Optional: close other items for an exclusive accordion feel
        items.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('is-open')) {
            otherItem.classList.remove('is-open');
            const otherBtn = otherItem.querySelector('.osh-faq-question');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        if (isOpen) {
          item.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
};

export default FaqSection;
