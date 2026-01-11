const UILayout = {
    init: () => {
        UILayout.renderHeroPortal(); // New Hero Portal
        // Footer is now rendered by GlobalFooter module
        UILayout.renderWhatsApp();
    },

    renderHeroPortal: () => {
        // Only render on index page where #hero-portal exists
        const heroEl = document.getElementById('hero-portal');
        if (!heroEl) return;

        const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || localStorage.getItem('lang') || 'it';
        const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});

        // Hero Images (The Stack)
        const images = [
            "assets/images/comandamenti-imsges/1.jpg",
            "assets/images/comandamenti-imsges/2.jpg",
            "assets/images/comandamenti-imsges/3.jpg"
        ];

        heroEl.innerHTML = `
            <div class="relative w-full h-[500px] md:aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group mx-auto">
                <!-- Background Stack (Flutter-like) -->
                <div id="hero-slider" class="absolute inset-0 bg-black">
                    ${images.map((src, i) => `
                        <img src="${src}" 
                             class="hero-portal-img absolute inset-0 w-full h-full object-cover ${i === 0 ? 'active' : ''}" 
                             data-index="${i}">
                    `).join('')}
                </div>

                <!-- Overlay Gradient -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 z-20"></div>

                <!-- Foreground Content -->
                <div class="absolute inset-0 flex flex-col items-center justify-end pb-16 z-30 text-center px-4">
                    <h2 class="text-4xl md:text-5xl font-playfair font-bold text-gold mb-4 leading-tight drop-shadow-xl tracking-wide" data-i18n="global.secrets_title">
                        ${i18n.global.secrets_title || "Non partire senza conoscere i 10 comandamenti di Fabio"}
                    </h2>
                    
                    <p class="text-cream text-lg md:text-xl font-light tracking-widest uppercase mb-8 opacity-90" data-i18n="global.ultimate_guide">
                        ${i18n.global.ultimate_guide || ''}
                    </p>
                    
                    <a href="sharm-secrets.html" class="px-10 py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(197,160,89,0.4)] hover:scale-105 transform" data-i18n="global.read_secrets">
                        ${i18n.global.read_secrets || ""}
                    </a>
                </div>
            </div>
        `;

        // Start Slider Logic
        let currentIndex = 0;
        const imgs = heroEl.querySelectorAll('.hero-portal-img');
        if (imgs.length > 1) {
            setInterval(() => {
                imgs[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % imgs.length;
                imgs[currentIndex].classList.add('active');
            }, 3000);
        }
    },

    renderPromoBanner: () => {
        // Remove existing banner if any
        const existing = document.getElementById('promo-banner');
        if (existing) existing.remove();

        const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || localStorage.getItem('lang') || 'it';
        const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});

        const div = document.createElement('div');
        div.id = 'promo-banner';
        div.className = 'promo-floating backdrop-blur-md';
        div.innerHTML = `
            <div class="flex items-center gap-4 w-full justify-center">
                <span class="text-gold text-xl">✨</span>
                <p class="text-white text-sm font-medium tracking-wide text-center">
                    <span class="text-gold font-bold" data-i18n="global.vip_access">${i18n.global.vip_access || ''}</span> 
                    <span data-i18n="global.secrets_title">${i18n.global.secrets_title || ''}</span>
                </p>
            </div>
        `;
        document.body.appendChild(div);
    },

    renderWhatsApp: () => {
        if (document.getElementById('whatsapp-float') || document.querySelector('.floating-whatsapp')) return;

        const div = document.createElement('div');
        div.id = 'whatsapp-float';
        div.className = 'fab-base floating-whatsapp';
        div.onclick = () => window.open('https://wa.me/201063239261', '_blank');
        div.innerHTML = `
            <span class="floating-whatsapp-icon" aria-hidden="true">
                <svg viewBox="0 0 32 32" class="floating-whatsapp-svg">
                    <path d="M16 3C9.4 3 4.1 8.1 4.1 14.6c0 2.5.8 4.8 2.3 6.8L5 27.5l6.3-1.9c1.8 1 3.8 1.5 5.8 1.5 6.6 0 11.9-5.1 11.9-11.6C29 8.1 22.6 3 16 3zm0 2.3c5.3 0 9.6 4.1 9.6 9.3 0 5.1-4.3 9.3-9.6 9.3-1.8 0-3.5-.5-5-1.3l-.4-.2-3.7 1.1 1.1-3.5-.2-.4c-1.2-1.5-1.8-3.3-1.8-5.1C6 9.4 10.3 5.3 16 5.3zm-3.4 4c-.3 0-.7.1-1 .1-.3.1-.8.4-.9.9-.2.5-.5 1.5-.5 1.7 0 .2-.1.6.3 1.1.4.5 1.1 1.7 2.4 2.8 1.3 1.2 2.9 1.9 3.4 2.1.5.2 1 .2 1.3.1.4-.1 1.3-.6 1.5-1.1.2-.5.2-1 .2-1.1s-.1-.3-.3-.4c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.6.1-.2.3-.7.8-.9 1-.2.1-.4.1-.6 0-.2-.1-.9-.3-1.7-1-.6-.6-1-1.3-1.2-1.5-.1-.3 0-.5.1-.6.1-.1.2-.2.3-.4.1-.1.1-.3 0-.4-.1-.1-.9-2.3-1.1-2.6-.1-.3-.3-.3-.4-.3z"></path>
                </svg>
            </span>
        `;
        document.body.appendChild(div);
    },

    setupInteractions: () => { }
};

window.UILayout = UILayout;
window.addEventListener('langChanged', () => {
    if (window.UILayout) {
        if (typeof window.UILayout.renderPromoBanner === 'function') window.UILayout.renderPromoBanner();
        if (typeof window.UILayout.renderHeroPortal === 'function') window.UILayout.renderHeroPortal();
    }
});
