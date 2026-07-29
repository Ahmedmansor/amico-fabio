// src/landing-sharm/components/HeroSection.js

const HeroSection = {
  init: () => {
    const host = document.getElementById('hero-section');
    if (!host) return;

    host.innerHTML = `
      <section class="lsh-hero">
        <!-- Video Background Container (src left empty for user to add) -->
        <div class="lsh-hero-video-wrap">
          <video class="lsh-hero-video" autoplay muted loop playsinline
                 poster="../assets/images/comandamenti-images/1.webp">
            <!-- <source src="" type="video/mp4"> -->
          </video>
          <!-- Poster fallback image shown while video is empty/loading -->
          <img src="../assets/images/comandamenti-images/1.webp"
               alt="Sharm El Sheikh" class="lsh-hero-poster" fetchpriority="high" />
        </div>

        <!-- Dark Gradient Overlay -->
        <div class="lsh-hero-overlay"></div>

        <!-- Hero Content -->
        <div class="lsh-hero-content">
          <span class="lsh-hero-badge">Offerta Esclusiva</span>
          <h1 class="lsh-hero-title">
            Vivi la Magia di <span>Sharm El Sheikh</span>
          </h1>
          <p class="lsh-hero-desc">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Scopri
            un'esperienza unica con escursioni private, tramonti mozzafiato
            e il calore dell'ospitalità egiziana.
          </p>
          <button class="lsh-hero-cta" id="hero-cta-btn" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 16l-6-6h12z"/>
            </svg>
            Prenota Ora
          </button>
        </div>
      </section>
    `;

    // Smooth scroll CTA to booking section
    const ctaBtn = document.getElementById('hero-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        const bookingSection = document.getElementById('booking-section');
        if (bookingSection) {
          bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
};

export default HeroSection;
