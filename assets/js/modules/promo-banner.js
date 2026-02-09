// ==========================================
// Promo Banner Module (Fixed & Centered)
// ==========================================

const __parts = (typeof window !== 'undefined' && window.location && window.location.pathname ? window.location.pathname.split('/') : []);
const __firstSegment = __parts.filter(Boolean)[0] || '';
// If we're on "/legal.html" (or any "/something.html"), the first segment is a file name, not a repo base.
const __repo = (__firstSegment && !__firstSegment.includes('.')) ? __firstSegment : '';
const __fallbackBase = __repo ? `/${__repo}/` : '/';
const __BASE = (typeof window !== 'undefined' && window.FABIO_BASE_URL) || __fallbackBase;

window.PromoBanner = {
  render: (settingsData) => {
    const container = document.getElementById('promo-banner-container');
    if (!container || !settingsData) return;

    // البحث عن إعدادات البانر
    let settings = null;
    if (Array.isArray(settingsData)) {
      settings = settingsData.find(row => row.key === 'promo_banner');
    } else {
      settings = settingsData;
    }

    if (!settings) return;

    // التحقق من التفعيل
    const isActive = String(settings.is_active).toUpperCase() === 'TRUE';

    if (!isActive) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    // تحديد اللغة والنص
    const lang = localStorage.getItem('lang') || 'it';
    const text = lang === 'en' ? settings.val_en : settings.val_it;

    // 🔥 التعديل الجذري هنا:
    // استخدمنا style مباشر عشان نضمن التوسط (Centering) 100%
    const closeIconSrc = (window.ImagePaths && window.ImagePaths.icons && window.ImagePaths.icons.closeIcon)
      ? window.ImagePaths.icons.closeIcon
      : `${__BASE}assets/images/icons/close-icon.svg`;

    const template = `
      <div style="
          position: fixed;
          top: 115px; /* المسافة من فوق */
          left: 50%;
          transform: translateX(-50%); /* السحر اللي بيوسطنه */
          z-index: 9999;
          width: 90%;
          max-width: 500px;
      ">
        <div class="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-black border border-white/30 shadow-2xl rounded-2xl px-4 py-3 flex items-center justify-between">
          <div class="flex-1 text-center font-bold text-sm md:text-base tracking-wide" style="font-family: 'Montserrat', sans-serif;">
            ${text}
          </div>
          <button type="button" 
                  style="background: transparent; border: none; margin-left: 12px; cursor: pointer; display: flex; align-items: center;"
                  onclick="window.PromoBanner.dismiss()" 
                  aria-label="Close">
            <img src="${closeIconSrc}" alt="Close" style="width: 24px; height: 24px; display: block;" />
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
      container.style.transition = 'opacity 0.5s ease-out';
      container.style.opacity = '0';
      setTimeout(() => {
        container.style.display = 'none';
        container.innerHTML = '';
        container.style.opacity = '1';
      }, 500);
    }
  }
};
