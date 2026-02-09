// assets/js/modules/reviews-renderer.js

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeReviews(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  if (Array.isArray(raw.list)) return raw.list;
  return [];
}

function clampRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

export function initReviews(langOverride) {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;

  const rawLang = langOverride
    || localStorage.getItem('fabio_lang')
    || localStorage.getItem('preferredLanguage')
    || document.documentElement.lang
    || 'it';
  const lang = String(rawLang).toLowerCase().trim();

  const i18n = lang.startsWith('en') ? (window.i18nEn || {}) : (window.i18nIt || {});
  const reviews = normalizeReviews(i18n.reviews);

  if (!reviews.length) {
    track.innerHTML = '';
    return;
  }

  const duplicated = reviews.concat(reviews);

  const facebookIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M22 12a10 10 0 1 0-11.563 9.874v-6.987H7.898V12h2.539V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.771-1.63 1.562V12h2.773l-.443 2.887h-2.33v6.987A10.003 10.003 0 0 0 22 12Z" />
    </svg>
  `;

  const cardsHtml = duplicated.map((review) => {
    const name = escapeHtml(review.name || review.author || review.user || '');
    const text = escapeHtml(review.text || review.message || review.content || review.review || '');
    const meta = escapeHtml(review.meta || review.date || review.source || '');
    const rating = clampRating(review.rating);

    const stars = Array.from({ length: 5 }).map((_, idx) => {
      const filled = idx < rating;
      return `
        <span class="review-star ${filled ? 'is-filled' : ''}" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        </span>
      `;
    }).join('');

    return `
      <article class="review-card" role="listitem">
        <div class="review-header">
          <div class="review-author">
            <div class="review-name">${name}</div>
            ${meta ? `<div class="review-meta">${meta}</div>` : ''}
          </div>
          <div class="review-facebook" aria-hidden="true">
            ${facebookIcon}
          </div>
        </div>
        <div class="review-rating" aria-label="Rating">${stars}</div>
        <div class="review-text">${text}</div>
      </article>
    `;
  }).join('');

  track.style.animation = 'none';
  track.innerHTML = cardsHtml;
  // Force reflow then restart animation
  void track.offsetWidth;
  track.style.animation = '';
}
