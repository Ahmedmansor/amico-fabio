// ==========================================
// Promo Banner Module
// ==========================================

window.PromoBanner = {
  render: (settingsData) => {
    const container = document.getElementById('promo-banner-container');
    if (!container || !settingsData) return;

    // settingsData is now an array. Find the row where key == 'promo_banner'
    let settings = null;
    if (Array.isArray(settingsData)) {
      settings = settingsData.find(row => row.key === 'promo_banner');
    } else {
      // Fallback if it's already an object
      settings = settingsData;
    }

    if (!settings) return;

    // Check if promo is active
    // Note: CSV booleans often come as string "TRUE" or "FALSE"
    const isActive = String(settings.is_active).toUpperCase() === 'TRUE';

    if (!isActive) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    // Get current language
    const lang = localStorage.getItem('lang') || 'it';
    // Use val_en / val_it based on mapping
    const text = lang === 'en' ? settings.val_en : settings.val_it;

    // Luxurious Dark Theme Styling
    // Gold background with black text for high visibility
    const template = `
      <div class="bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-black shadow-lg">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div class="flex-1 text-center font-bold text-sm md:text-base tracking-wide">
            ${text}
          </div>
          <button type="button" class="ml-4 text-black hover:text-gray-800 focus:outline-none" onclick="window.PromoBanner.dismiss()">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    container.innerHTML = template;
    container.style.display = 'block';
  },

  dismiss: () => {
    const container = document.getElementById('promo-banner-container');
    if (container) {
      // Animate out
      container.style.transition = 'opacity 0.5s ease-out';
      container.style.opacity = '0';
      setTimeout(() => {
        container.style.display = 'none';
        container.innerHTML = '';
        container.style.opacity = '1'; // Reset for next time
      }, 500);
    }
  }
};
