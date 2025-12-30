const DetailsRenderer = {
    init: async () => {
        const params = new URLSearchParams(window.location.search);
        const tripId = params.get('id');

        if (!tripId) {
            window.location.href = 'index.html';
            return;
        }

        // 1. Static Data (Priority)
        // Why: Read the unified language state to ensure details page matches global selection.
        const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
        const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const langData = i18n.trips ? i18n.trips[tripId] : null;

        // 2. Dynamic Data (Prices)
        let apiData = null;
        if (window.api && window.api.fetchAllData) {
            const data = await window.api.fetchAllData();
            apiData = data ? data.Trips_Prices.find(t => t.trip_id === tripId) : null;
        }

        if (langData || apiData) {
            DetailsRenderer.render(tripId, apiData, langData, lang);
        } else {
            const dict = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
            const msg = dict && dict.global && typeof dict.global.experience_not_found === 'string' ? dict.global.experience_not_found : '';
            document.querySelector('main').innerHTML = `
                <div class="h-screen flex items-center justify-center text-white">
                    <h1 class="text-3xl font-playfair text-gold" data-i18n="global.experience_not_found">${msg}</h1>
                </div>
            `;
        }
    },

    render: (tripId, apiData, langData, lang) => {
        // Fallbacks
        const title = (langData && langData.title) || (apiData && apiData.trip_id) || tripId;
        const price = apiData ? parseFloat(apiData.p_adult) : 0;
        const discount = apiData ? parseFloat(apiData.d_adult) : 0;
        const badge = apiData ? (lang === 'en' ? apiData.badge_en : apiData.badge_it) : '';

        // Elements
        const els = {
            bg: document.getElementById('hero-bg'),
            title: document.getElementById('detail-title'),
            badge: document.getElementById('detail-badge'),
            duration: document.getElementById('detail-duration'),
            price: document.getElementById('detail-price'),
            desc: document.getElementById('detail-desc'),
            highlights: document.getElementById('detail-highlights'),
            fullDesc: document.getElementById('detail-full-desc'),
            program: document.getElementById('detail-program'), // New
            important: document.getElementById('detail-important'),
            cardPrice: document.getElementById('card-price'),
            includes: document.getElementById('detail-includes'),
            excludes: document.getElementById('detail-excludes'),
            gallery: document.getElementById('gallery-grid'),
            btnBook: document.getElementById('btn-book')
        };

        // Hero Image Logic (poster.jpg -> fallback)
        const posterSrc = `assets/images/trips/${tripId}/poster.jpg`;
        const fallbackSrc = 'assets/logo-fabio-square.jpg';

        // Optimistic Load
        if (els.bg) {
            els.bg.style.backgroundImage = `url('${posterSrc}')`;
            const imgTest = new Image();
            imgTest.src = posterSrc;
            imgTest.onerror = () => { els.bg.style.backgroundImage = `url('${fallbackSrc}')`; };
        }

        // Text Content
        if (els.title) els.title.textContent = title;

        // Badge
        if (els.badge) {
            if (badge) {
                els.badge.textContent = badge;
                els.badge.style.display = 'inline-block';
            } else {
                els.badge.style.display = 'none';
            }
        }

        // Price Logic (Discount)
        const priceHTML = discount > 0
            ? `<span class="price-strike text-lg mr-2">€${price}</span> €${discount}`
            : `€${price}`;

        if (els.price) els.price.innerHTML = priceHTML;
        if (els.cardPrice) els.cardPrice.innerHTML = priceHTML;

        if (langData) {
            const dict = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
            const daily = dict && dict.global && typeof dict.global.daily === 'string' ? dict.global.daily : '';
            if (els.duration) els.duration.textContent = langData.duration || daily;
            if (els.desc) els.desc.innerHTML = langData.short_desc || '';
            if (els.fullDesc) els.fullDesc.innerHTML = langData.full_description || '';
            if (els.important) els.important.textContent = langData.important || '';

            // Lists
            DetailsRenderer.renderList(els.highlights, langData.highlights);
            DetailsRenderer.renderList(els.includes, langData.includes, true, 'check');
            DetailsRenderer.renderList(els.excludes, langData.not_included, true, 'cross');

            // Program (New Requirement)
            if (els.program && langData.program) {
                DetailsRenderer.renderProgram(els.program, langData.program);
            }
        }

        // Button Text
        const dictBtn = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const bookNow = dictBtn && dictBtn.global && typeof dictBtn.global.book_now === 'string' ? dictBtn.global.book_now : '';
        if (els.btnBook) els.btnBook.textContent = bookNow;

        // Gallery Loop (Sequential 1.jpg, 2.jpg... stop on 404)
        if (els.gallery) {
            els.gallery.innerHTML = ''; // Clear

            // 1. Add Poster as First Thumbnail
            DetailsRenderer.appendGalleryItem(posterSrc, els.gallery, els.bg);

            // 2. Start Loop from 1.jpg
            DetailsRenderer.loadGalleryImages(tripId, 1, els.gallery, els.bg);
        }
    },

    loadGalleryImages: (tripId, index, container, bgEl) => {
        // Try JPG first
        const srcJpg = `assets/images/trips/${tripId}/${index}.jpg`;
        const srcPng = `assets/images/trips/${tripId}/${index}.png`;

        const img = new Image();
        img.src = srcJpg;

        img.onload = () => {
            // Success: Append and try next
            DetailsRenderer.appendGalleryItem(srcJpg, container, bgEl);
            DetailsRenderer.loadGalleryImages(tripId, index + 1, container, bgEl);
        };

        img.onerror = () => {
            // Failed JPG, try PNG
            const imgPng = new Image();
            imgPng.src = srcPng;
            imgPng.onload = () => {
                DetailsRenderer.appendGalleryItem(srcPng, container, bgEl);
                DetailsRenderer.loadGalleryImages(tripId, index + 1, container, bgEl);
            };
            imgPng.onerror = () => {
                // Both failed: Stop loop silently for performance and cleanliness.
            };
        };
    },

    appendGalleryItem: (src, container, bgEl) => {
        const wrapper = document.createElement('div');
        // Horizontal Scroll Item Styling
        wrapper.className = "flex-shrink-0 w-32 h-32 md:w-40 md:h-40 aspect-square rounded-xl overflow-hidden cursor-pointer relative group border border-gray-100 shadow-md snap-center";
        wrapper.innerHTML = `
            <img src="${src}" class="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110">
            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg class="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
        `;

        wrapper.onclick = () => {
            if (bgEl) {
                bgEl.style.backgroundImage = `url('${src}')`;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        container.appendChild(wrapper);
    },

    renderList: (container, items, isCompact = false, iconType = 'check') => {
        if (!items || !Array.isArray(items) || !container) return;

        container.innerHTML = items.map(item => {
            const icon = isCompact
                ? (iconType === 'check' ? '<span class="text-gold mr-3 font-bold">✓</span>' : '<span class="text-gray-400 mr-3 font-bold">×</span>')
                : '<span class="text-gold mr-3 text-xl">•</span>';

            return `
            <li class="flex items-start leading-relaxed border-b border-gray-100 pb-2 last:border-0">
                ${icon}
                <span class="${isCompact ? 'text-gray-600 text-sm' : 'text-gray-800 font-medium'}">${item}</span>
            </li>
            `;
        }).join('');
    },

    renderProgram: (container, steps) => {
        if (!steps || !Array.isArray(steps) || !container) return;

        // Simple vertical timeline
        container.innerHTML = steps.map((step, i) => `
            <div class="flex gap-4 mb-6 last:mb-0 relative">
                <div class="flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center font-bold text-sm shadow-lg z-10">
                        ${i + 1}
                    </div>
                    ${i !== steps.length - 1 ? '<div class="w-0.5 h-full bg-gray-100 absolute top-8"></div>' : ''}
                </div>
                <div class="pb-2">
                    <p class="text-gray-700 leading-relaxed">${step}</p>
                </div>
            </div>
        `).join('');
    }
};

window.DetailsRenderer = DetailsRenderer;
