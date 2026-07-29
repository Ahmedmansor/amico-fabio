// src/landing-sharm/components/LandingFooter.js

const LandingFooter = {
  init: () => {
    const host = document.getElementById('landing-footer');
    if (!host) return;

    const year = new Date().getFullYear();

    host.innerHTML = `
      <footer class="lsh-footer">
        <div class="lsh-footer-inner">
          <span class="lsh-footer-brand">FABIO EGYPT</span>
          <p class="lsh-footer-copy">&copy; 2025 - ${year} Fabio Egypt &mdash; Tutti i diritti riservati.</p>
          <div class="lsh-footer-socials">
            <a href="https://www.facebook.com/CROSSROOTSTRAVEL" target="_blank" rel="noopener noreferrer"
               class="lsh-footer-social-link" aria-label="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M22 12a10 10 0 1 0-11.563 9.874v-6.987H7.898V12h2.539V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.771-1.63 1.562V12h2.773l-.443 2.887h-2.33v6.987A10.003 10.003 0 0 0 22 12Z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/fabio_egypt_vip" target="_blank" rel="noopener noreferrer"
               class="lsh-footer-social-link" aria-label="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.25-2.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
              </svg>
            </a>
            <a href="https://wa.me/201063239261" target="_blank" rel="noopener noreferrer"
               class="lsh-footer-social-link" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347ZM12.05 21.785h-.01a9.86 9.86 0 0 1-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374A9.86 9.86 0 0 1 2.16 12.04C2.162 6.584 6.59 2.16 12.055 2.16a9.84 9.84 0 0 1 6.995 2.897 9.84 9.84 0 0 1 2.893 7.003c-.003 5.456-4.432 9.88-9.893 9.88v-.155ZM20.52 3.449A11.79 11.79 0 0 0 12.05.16C5.495.16.16 5.488.157 12.04a11.8 11.8 0 0 0 1.583 5.919L.003 24l6.193-1.623a11.85 11.85 0 0 0 5.65 1.44h.005c6.554 0 11.89-5.328 11.893-11.88a11.81 11.81 0 0 0-3.48-8.398l.256-.09Z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    `;
  }
};

export default LandingFooter;
