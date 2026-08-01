// src/landing-sharm/components/VideoTestimonials.js

const reviewsData = [
  {
    id: "1214756632",
    title: "Il parco marino di ras Mohamed",
    thumbnail: "/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_13.webp"
  },
  {
    id: "1214757531",
    title: "Il parco marino di ras Mohamed",
    thumbnail: "/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_7.webp"
  },
  {
    id: "1214758552",
    title: "Soho square",
    thumbnail: "/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_10.webp"
  },
  {
    id: "1214760129",
    title: "l’escursione del safari",
    thumbnail: "/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_20.webp"
  },
  {
    id: "1214757761",
    title: "la nostra macchina privata VIP",
    thumbnail: "/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_14.webp"
  },
  {
    id: "1214758307",
    title: "la città magica di Dahab",
    thumbnail: "/assets/images/offerta-sharm-land-page/reviews/thumbnail_project_40.webp"
  }
];

const playSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const closeSvg = `<svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

let autoScrollTimer = null;
let isVideoModalOpen = false;

/**
 * "I nostri clienti in viaggio" — Video Testimonials Widget
 * Features native CSS horizontal scroll-snap, automatic smooth scrolling,
 * facade pattern, Video Lightbox Modal with Close Button (✕), Mobile Back Button integration,
 * ESC key support, and auto-scroll resumption.
 */
const VideoTestimonials = {
  init: () => {
    const host = document.getElementById('videos-section');
    if (!host) return;

    host.innerHTML = `
      <section class="osh-section" id="videos-block">
        <div class="osh-container">
          <div class="osh-section-header">
            <h2 class="osh-section-title">I nostri clienti in viaggio</h2>
          </div>

          <div class="osh-videos-scroll-wrapper">
            <div class="osh-videos-track" id="osh-videos-track">
              ${reviewsData.map((item, index) => `
                <div class="osh-video-card" data-video-id="${item.id}" data-index="${index}">
                  <div class="osh-video-media">
                    <img class="osh-video-thumb" src="${item.thumbnail}" alt="${item.title}" loading="lazy" />
                    <div class="osh-video-play">
                      <div class="osh-video-play-icon">${playSvg}</div>
                    </div>
                  </div>
                  <div class="osh-video-caption">
                    <h3 class="osh-video-caption-title">${item.title}</h3>
                    <span class="osh-video-caption-sub">Guarda il video</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- Video Lightbox Modal Overlay -->
      <div class="osh-video-modal" id="osh-video-modal" aria-hidden="true" role="dialog" aria-label="Riproduttore video">
        <div class="osh-video-modal-backdrop" id="osh-video-modal-backdrop"></div>
        <div class="osh-video-modal-container">
          <button class="osh-video-modal-close" id="osh-video-modal-close" aria-label="Chiudi video">
            ${closeSvg}
          </button>
          <div class="osh-video-modal-body" id="osh-video-modal-body"></div>
        </div>
      </div>
    `;

    VideoTestimonials._bindEvents();
    VideoTestimonials._bindModalEvents();
    VideoTestimonials._startAutoScroll();
  },

  _startAutoScroll: () => {
    const track = document.getElementById('osh-videos-track');
    if (!track) return;

    if (autoScrollTimer) clearInterval(autoScrollTimer);

    autoScrollTimer = setInterval(() => {
      if (isVideoModalOpen) return;

      const maxScroll = track.scrollWidth - track.clientWidth;
      const card = track.querySelector('.osh-video-card');
      const stepWidth = card ? card.clientWidth + 20 : 320;

      if (track.scrollLeft >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: stepWidth, behavior: 'smooth' });
      }
    }, 3500);
  },

  _stopAutoScroll: () => {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  },

  _openModal: (videoId, title) => {
    const modal = document.getElementById('osh-video-modal');
    const modalBody = document.getElementById('osh-video-modal-body');
    if (!modal || !modalBody) return;

    VideoTestimonials._stopAutoScroll();
    isVideoModalOpen = true;

    // Inject Vimeo iframe into modal
    modalBody.innerHTML = `
      <iframe
        src="https://player.vimeo.com/video/${videoId}?autoplay=1&dnt=1"
        class="osh-video-modal-iframe"
        title="${title || 'Video'}"
        frameborder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        webkitallowfullscreen
        mozallowfullscreen>
      </iframe>
    `;

    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Push state for mobile back button compatibility
    try {
      history.pushState({ videoModalOpen: true }, '');
    } catch (e) {}
  },

  _closeModal: (fromPopState = false) => {
    const modal = document.getElementById('osh-video-modal');
    const modalBody = document.getElementById('osh-video-modal-body');
    if (!modal || !isVideoModalOpen) return;

    isVideoModalOpen = false;
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (modalBody) {
      modalBody.innerHTML = '';
    }

    if (!fromPopState && history.state && history.state.videoModalOpen) {
      try {
        history.back();
      } catch (e) {}
    }

    // Resume auto-scroll
    VideoTestimonials._startAutoScroll();
  },

  _bindModalEvents: () => {
    const backdrop = document.getElementById('osh-video-modal-backdrop');
    const closeBtn = document.getElementById('osh-video-modal-close');

    if (backdrop) {
      backdrop.addEventListener('click', () => VideoTestimonials._closeModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => VideoTestimonials._closeModal());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isVideoModalOpen) {
        VideoTestimonials._closeModal();
      }
    });

    window.addEventListener('popstate', () => {
      if (isVideoModalOpen) {
        VideoTestimonials._closeModal(true);
      }
    });
  },

  _bindEvents: () => {
    const track = document.getElementById('osh-videos-track');
    if (!track) return;

    track.querySelectorAll('.osh-video-card').forEach(card => {
      card.addEventListener('click', () => {
        const videoId = card.getAttribute('data-video-id');
        const title = card.querySelector('.osh-video-caption-title')?.textContent || '';
        VideoTestimonials._openModal(videoId, title);
      });
    });
  }
};

export default VideoTestimonials;
