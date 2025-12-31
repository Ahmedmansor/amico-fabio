const UILayout = {
    init: () => {
        UILayout.renderHeroPortal(); // New Hero Portal
        // Footer is now rendered by GlobalFooter module
        UILayout.renderWhatsApp();
    },

    renderHeader: () => { },

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
                    <h2 class="text-4xl md:text-5xl font-playfair font-bold text-gold mb-4 leading-tight drop-shadow-xl tracking-wide">
                        ${i18n.global.secrets_title || "Non partire senza conoscere i 10 comandamenti di Fabio"}
                    </h2>
                    
                    <p class="text-cream text-lg md:text-xl font-light tracking-widest uppercase mb-8 opacity-90" data-i18n="global.ultimate_guide">
                        ${i18n.global.ultimate_guide || ''}
                    </p>
                    
                    <a href="sharm-secrets.html" class="px-10 py-4 bg-gold text-black font-bold uppercase tracking-widest rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(197,160,89,0.4)] hover:scale-105 transform">
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

    renderFooter: () => {
        const footerEl = document.getElementById('global-footer');
        if (!footerEl) return;

        const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || localStorage.getItem('lang') || 'it';
        const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const year = new Date().getFullYear();

        footerEl.innerHTML = `
            <div class="bg-black text-white border-t border-white/10 pt-20 pb-10">
                <div class="container mx-auto px-6 text-center">
                    <h3 class="text-5xl font-playfair font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-white to-gold mb-8">FABIO</h3>
                    
                    <div class="flex justify-center gap-8 mb-12">
                        <a href="#" class="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-gold hover:text-black hover:border-gold transition-all duration-300">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                        </a>
                        <a href="#" class="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-gold hover:text-black hover:border-gold transition-all duration-300">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                    </div>

                    <p class="text-gray-600 text-xs tracking-[0.2em] uppercase">&copy; ${year} Fabio VIP Tourism. <span data-i18n="global.all_rights">${i18n.global.all_rights || ''}</span></p>
                </div>
            </div>
        `;
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

    setLang: (lang) => {
        localStorage.setItem('lang', lang);
        window.location.reload();
    },

    setupInteractions: () => { }
};

window.UILayout = UILayout;
