// src/landing-sharm/components/ReviewsContainer.js

// Why: image_paths.js MUST be loaded before global-it.js as global-it.js references window.ImagePaths
import '../../../assets/js/image_paths.js';
import '../../../assets/lang/global-it.js';
import { initReviews } from '../../../assets/js/modules/reviews-renderer.js';

/**
 * Reviews Container Widget
 * Injects the authentic reviews data from global-it.js into #reviewsTrack
 * using the project's existing reviews-renderer.js module.
 */
const ReviewsContainer = {
  init: () => {
    const host = document.getElementById('landing-reviews-section');
    if (!host) return;

    host.innerHTML = `
      <section class="osh-reviews-section" id="reviews-block">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">Dicono di Noi</h2>
            <p class="osh-section-subtitle">Le parole dei nostri ospiti su Facebook</p>
          </div>

          <div class="osh-reviews-slider">
            <div id="reviewsTrack" class="reviews-track" role="list" aria-label="Testimonianze"></div>
          </div>

          <div style="display: flex; justify-content: center; margin-top: 1.8rem;">
            <a class="reviews-facebook-btn" target="_blank" rel="noopener noreferrer"
               href="https://www.facebook.com/CROSSROOTSTRAVEL/reviews/?id=100063543025466&sk=reviews">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M22 12a10 10 0 1 0-11.563 9.874v-6.987H7.898V12h2.539V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.771-1.63 1.562V12h2.773l-.443 2.887h-2.33v6.987A10.003 10.003 0 0 0 22 12Z" />
              </svg>
              <span>Leggi su Facebook</span>
            </a>
          </div>
        </div>
      </section>
    `;

    // Initialize reviews rendering using the existing renderer module
    initReviews('it');
  }
};

export default ReviewsContainer;
