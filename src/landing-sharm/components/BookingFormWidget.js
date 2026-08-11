// src/landing-sharm/components/BookingFormWidget.js

/**
 * Booking Form Widget
 * 3 input fields: Name, Arrival Date, Number of People.
 * On submit → constructs Italian WhatsApp message → redirects to wa.me API.
 */

// Why: Phone number as a configurable constant for easy replacement.
const WHATSAPP_NUMBER = '201063239261';

const BookingFormWidget = {
  init: () => {
    const host = document.getElementById('booking-section');
    if (!host) return;

    host.innerHTML = `
      <section class="osh-booking-section" id="booking-form-block">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">Richiedi un Preventivo </h2>
            <p class="osh-section-subtitle">Compila il modulo e ti rispondiamo subito su WhatsApp</p>
          </div>

          <div class="osh-booking-card">
            <form class="osh-form" id="lsh-booking-form" novalidate>
              <div class="osh-form-group">
                <label class="osh-form-label" for="lsh-name">Nome Completo</label>
                <input class="osh-form-input" type="text" id="lsh-name"
                       placeholder="Il tuo nome..." autocomplete="name" required />
                <span class="osh-form-error" id="lsh-name-error">Per favore inserisci il tuo nome.</span>
              </div>

              <div class="osh-form-group">
                <label class="osh-form-label" for="lsh-date">Data di Arrivo</label>
                <input class="osh-form-input" type="date" id="lsh-date" required />
                <span class="osh-form-error" id="lsh-date-error">Per favore seleziona una data.</span>
              </div>

              <div class="osh-form-group">
                <label class="osh-form-label" for="lsh-people">Numero di Persone</label>
                <input class="osh-form-input" type="number" id="lsh-people"
                       min="1" max="30" value="2" placeholder="2" required />
                <span class="osh-form-error" id="lsh-people-error">Inserisci un numero valido (1-30).</span>
              </div>

              <button class="osh-form-submit" id="whatsapp-booking-btn" type="submit">
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347ZM12.05 21.785h-.01a9.86 9.86 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.86 9.86 0 0 1 2.16 12.04C2.162 6.584 6.59 2.16 12.055 2.16c1.87 0 3.66.502 5.225 1.45a9.84 9.84 0 0 1 1.77 1.447 9.84 9.84 0 0 1 2.893 7.003c-.003 5.456-4.432 9.88-9.893 9.88v-.155ZM20.52 3.449A11.79 11.79 0 0 0 12.05.16C5.495.16.16 5.488.157 12.04a11.8 11.8 0 0 0 1.583 5.919L.003 24l6.193-1.623a11.85 11.85 0 0 0 5.65 1.44h.005c6.554 0 11.89-5.328 11.893-11.88a11.81 11.81 0 0 0-3.48-8.398l.256-.09Z" />
                </svg>
                Prenota su WhatsApp
              </button>

              <div class="osh-form-trust">
                <span class="osh-form-trust-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Risposta in 15 min
                </span>
                <span class="osh-form-trust-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                  Prenotazione Flessibile 
                </span>
                <span class="osh-form-trust-item">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Assistenza in Italiano
                </span>
              </div>
            </form>
          </div>
        </div>
      </section>
    `;

    BookingFormWidget._bindForm();
  },

  _bindForm: () => {
    const form = document.getElementById('lsh-booking-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      BookingFormWidget._handleSubmit();
    });
  },

  _handleSubmit: () => {
    const nameInput = document.getElementById('lsh-name');
    const dateInput = document.getElementById('lsh-date');
    const peopleInput = document.getElementById('lsh-people');

    if (!nameInput || !dateInput || !peopleInput) return;

    // Reset error states
    BookingFormWidget._hideError('lsh-name-error');
    BookingFormWidget._hideError('lsh-date-error');
    BookingFormWidget._hideError('lsh-people-error');

    const name = nameInput.value.trim();
    const date = dateInput.value;
    const people = parseInt(peopleInput.value, 10);

    let isValid = true;

    if (!name) {
      BookingFormWidget._showError('lsh-name-error');
      isValid = false;
    }

    if (!date) {
      BookingFormWidget._showError('lsh-date-error');
      isValid = false;
    }

    if (!people || people < 1 || people > 30) {
      BookingFormWidget._showError('lsh-people-error');
      isValid = false;
    }

    if (!isValid) return;

    // Format date for readability (DD/MM/YYYY)
    const dateParts = date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    // Construct Italian WhatsApp message
    const message = [
      `🌴 *Nuova Prenotazione — Offerta Sharm*`,
      ``,
      `👤 *Nome:* ${name}`,
      `📅 *Data di Arrivo:* ${formattedDate}`,
      `👥 *Numero di Persone:* ${people}`,
      ``,
      `Ciao Fabio! Sono interessato/a all'offerta Sharm El Sheikh. Vorrei maggiori informazioni e confermare la prenotazione. Grazie! 🙏`
    ].join('\n');

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;

    // Track GA4 Conversion Event safely
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'generate_lead', {
        currency: 'EUR',
        value: 1,
        event_category: 'Booking',
        event_label: 'WhatsApp_Sharm_Offer'
      });
    }

    // Redirect to WhatsApp
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  },

  _showError: (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('visible');
  },

  _hideError: (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
  }
};

export default BookingFormWidget;
