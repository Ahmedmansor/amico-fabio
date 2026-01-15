const DetailsRenderer = {
    init: async () => {
        const params = new URLSearchParams(window.location.search);
        const tripId = params.get('id');

        // 1. Handshake Signal (أضف هذا السطر)
        // هذا السطر يخبر صفحة Explore أننا قادمون من التفاصيل عند العودة
        sessionStorage.setItem('fabio_nav_source', 'details');

        if (!tripId) {
            window.location.href = 'index.html';
            return;
        }
        if (typeof DetailsRenderer.renderGalleryImmediate === 'function') {
            DetailsRenderer.renderGalleryImmediate(tripId);
        }

        const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
        const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const langData = i18n.trips ? i18n.trips[tripId] : null;

        let apiData = null;
        // 2. Cache Name Fix (عدل هذا السطر)
        // غيرنا الاسم ليتطابق مع Explore Page
        const cached = sessionStorage.getItem('fabio_data_cache');

        if (cached) {
            try {
                const obj = JSON.parse(cached);
                // 3. Data Structure Fix (تأكد من قراءة الهيكل الصحيح)
                // الكاش الجديد قد يكون array مباشر أو object، نتحوط للاثنين
                const tripsList = Array.isArray(obj) ? obj : (obj.Trips_Prices || []);
                apiData = tripsList.find(t => t.trip_id === tripId);
            } catch (e) { }
        }

        if (apiData || langData) {
            if (apiData) {
                DetailsRenderer.render(tripId, apiData, langData, lang);
            } else {
                DetailsRenderer.renderStaticFirst(tripId, langData, lang);
                if (window.api && window.api.fetchAllData) {
                    const data = await window.api.fetchAllData();
                    // تحديث الكاش بالمرة لو اضطرينا نجيب داتا جديدة
                    sessionStorage.setItem('fabio_data_cache', JSON.stringify(data));

                    const tripsList = data.Trips_Prices || [];
                    const live = tripsList.find(t => t.trip_id === tripId);
                    if (live) DetailsRenderer.updatePriceOnly(live);
                }
            }
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
        const activeLang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
        const i18nCurrent = activeLang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const langDataCurrent = i18nCurrent.trips ? i18nCurrent.trips[tripId] : null;
        lang = activeLang;
        langData = langDataCurrent || langData;
        const title = (langData && langData.title) || (apiData && apiData.trip_id) || tripId;
        const pAdult = apiData ? parseFloat(apiData.p_adult || '0') : 0;
        const dAdult = apiData ? parseFloat(apiData.d_adult || '0') : 0;
        const pChild = apiData ? parseFloat(apiData.p_child || '0') : 0;
        const dChild = apiData ? parseFloat(apiData.d_child || '0') : 0;
        const minPax = apiData ? parseInt(apiData.min_pax || '1', 10) : 1;
        const badge = apiData ? (lang === 'en' ? apiData.badge_en : apiData.badge_it) : '';

        document.title = `Fabio Tours | ${title}`;
        const metaDesc = document.querySelector('meta[name="description"]') || (function () {
            const m = document.createElement('meta');
            m.setAttribute('name', 'description');
            document.head.appendChild(m);
            return m;
        })();
        const descText = (langData && langData.short_desc) || (langData && langData.full_description) || '';
        const cleanDesc = typeof descText === 'string' ? descText.replace(/\s+/g, ' ').trim().slice(0, 200) : '';
        if (metaDesc) metaDesc.setAttribute('content', cleanDesc);

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

        const ctx = window.ImagePaths ? window.ImagePaths.resolveTripContext({ trip_id: tripId, ...(apiData || {}) }) : { location: '', category: '', tripId };
        const posterSrc = window.ImagePaths ? window.ImagePaths.getPoster(ctx.location, ctx.category, tripId) : `assets/images/trips/${tripId}/poster.webp`;
        const fallbackSrc = window.ImagePaths ? window.ImagePaths.ui.fallbackLogo : 'assets/logo-fabio-square.jpg';

        // Optimistic Load
        if (els.bg) {
            els.bg.style.backgroundImage = `url('${posterSrc}')`;
            if (window.ImagePaths && typeof window.ImagePaths.resolvePosterOrPlaceholder === 'function') {
                window.ImagePaths.resolvePosterOrPlaceholder(ctx.location, ctx.category, tripId).then(src => {
                    els.bg.style.backgroundImage = `url('${src}')`;
                });
            } else {
                const imgTest = new Image();
                imgTest.src = posterSrc;
                imgTest.onerror = () => { els.bg.style.backgroundImage = `url('${fallbackSrc}')`; };
            }
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

        const adultHero = dAdult > 0
            ? `<span class="inline-flex items-center gap-2"><span>👤</span><span class="line-through text-gray-400">€${pAdult}</span><span class="text-gold font-bold">€${dAdult}</span></span>`
            : `<span class="inline-flex items-center gap-2"><span>👤</span><span class="text-gold font-bold">€${pAdult}</span></span>`;
        if (els.price) els.price.innerHTML = adultHero;
        const headlinePrice = dAdult > 0 ? dAdult : pAdult;
        if (els.cardPrice) els.cardPrice.textContent = `€${headlinePrice}`;
        const breakdownEl = document.getElementById('card-price-breakdown');
        if (breakdownEl) {
            const adultRow = dAdult > 0
                ? `<div class="flex items-center gap-2"><span>👤</span><span class="line-through text-gray-400">€${pAdult}</span><span class="text-white font-bold">€${dAdult}</span></div>`
                : `<div class="flex items-center gap-2"><span>👤</span><span class="text-white font-bold">€${pAdult}</span></div>`;
            const childRow = (dChild > 0 || pChild > 0)
                ? (dChild > 0
                    ? `<div class="flex items-center gap-2"><span>👶</span><span class="line-through text-gray-400">€${pChild}</span><span class="text-white font-bold">€${dChild}</span></div>`
                    : `<div class="flex items-center gap-2"><span>👶</span><span class="text-white font-bold">€${pChild}</span></div>`)
                : '';
            const minPaxRow = `<div class="flex items-center gap-2"><span>👥</span><span class="text-gray-300">Min Pax: ${minPax}</span></div>`;
            breakdownEl.innerHTML = `${adultRow}${childRow ? childRow : ''}${minPaxRow}`;
        }

        if (langData) {
            const dict = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
            const daily = dict && dict.global && typeof dict.global.daily === 'string' ? dict.global.daily : '';
            if (els.duration) els.duration.textContent = langData.duration || daily;
            if (els.desc) els.desc.innerHTML = langData.short_desc || '';
            if (els.fullDesc) els.fullDesc.innerHTML = langData.full_description || '';
            if (els.important) els.important.textContent = langData.important_notes || '';

            // Lists
            DetailsRenderer.renderList(els.highlights, langData.highlights);
            DetailsRenderer.renderList(els.includes, langData.includes, true, 'check');
            DetailsRenderer.renderList(els.excludes, langData.not_included, true, 'cross');

            if (els.program && langData.program) {
                DetailsRenderer.renderProgram(els.program, langData.program);
            }
        }

        // Button Text
        const dictBtn = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const bookNow = dictBtn && dictBtn.global && typeof dictBtn.global.book_now === 'string' ? dictBtn.global.book_now : '';
        if (els.btnBook) els.btnBook.textContent = bookNow;

        // Gallery
        if (els.gallery) {
            if (els.gallery.children.length === 0) {
                const totalRaw = window.ImagePaths && typeof window.ImagePaths.pickCI === 'function' ? window.ImagePaths.pickCI(apiData || {}, 'img_count') : '';
                const total = parseInt(totalRaw || '0', 10);
                const list = window.ImagePaths && typeof window.ImagePaths.getGalleryArray === 'function'
                    ? window.ImagePaths.getGalleryArray(ctx.location, ctx.category, tripId, total)
                    : [];
                DetailsRenderer.appendGalleryItem(posterSrc, els.gallery, els.bg);
                if (Array.isArray(list) && list.length > 0) {
                    list.forEach(src => DetailsRenderer.appendGalleryItem(src, els.gallery, els.bg));
                }
            }
        }
    },
    renderStaticFirst: (tripId, langData, lang) => {
        const els = {
            bg: document.getElementById('hero-bg'),
            title: document.getElementById('detail-title'),
            badge: document.getElementById('detail-badge'),
            duration: document.getElementById('detail-duration'),
            price: document.getElementById('detail-price'),
            desc: document.getElementById('detail-desc'),
            highlights: document.getElementById('detail-highlights'),
            fullDesc: document.getElementById('detail-full-desc'),
            program: document.getElementById('detail-program'),
            important: document.getElementById('detail-important'),
            cardPrice: document.getElementById('card-price'),
            cardBreakdown: document.getElementById('card-price-breakdown'),
            includes: document.getElementById('detail-includes'),
            excludes: document.getElementById('detail-excludes'),
            gallery: document.getElementById('gallery-grid'),
            btnBook: document.getElementById('btn-book')
        };
        const ctx = window.ImagePaths ? window.ImagePaths.resolveTripContext({ trip_id: tripId }) : { location: '', category: '', tripId };
        const posterSrc = window.ImagePaths ? window.ImagePaths.getPoster(ctx.location, ctx.category, tripId) : `assets/images/trips/${tripId}/poster.webp`;
        const fallbackSrc = window.ImagePaths ? window.ImagePaths.ui.fallbackLogo : 'assets/logo-fabio-square.jpg';
        if (els.bg) {
            els.bg.style.backgroundImage = `url('${posterSrc}')`;
            if (window.ImagePaths && typeof window.ImagePaths.resolvePosterOrPlaceholder === 'function') {
                window.ImagePaths.resolvePosterOrPlaceholder(ctx.location, ctx.category, tripId).then(src => {
                    els.bg.style.backgroundImage = `url('${src}')`;
                });
            } else {
                const imgTest = new Image();
                imgTest.src = posterSrc;
                imgTest.onerror = () => { els.bg.style.backgroundImage = `url('${fallbackSrc}')`; };
            }
        }
        const title = (langData && langData.title) || tripId;
        if (els.title) els.title.textContent = title;
        if (els.price) els.price.innerHTML = `<span class="price-skeleton inline-block"></span>`;
        if (els.cardPrice) els.cardPrice.innerHTML = `<span class="price-skeleton inline-block"></span>`;
        if (els.cardBreakdown) els.cardBreakdown.innerHTML = `<div class="price-skeleton" style="width: 80%; height: 1.2rem;"></div>`;
        if (langData) {
            const dict = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
            const daily = dict && dict.global && typeof dict.global.daily === 'string' ? dict.global.daily : '';
            if (els.duration) els.duration.textContent = langData.duration || daily;
            if (els.desc) els.desc.innerHTML = langData.short_desc || '';
            if (els.fullDesc) els.fullDesc.innerHTML = langData.full_description || '';
            if (els.important) els.important.textContent = langData.important_notes || '';
            DetailsRenderer.renderList(els.highlights, langData.highlights);
            DetailsRenderer.renderList(els.includes, langData.includes, true, 'check');
            DetailsRenderer.renderList(els.excludes, langData.not_included, true, 'cross');
            if (els.program && langData.program) {
                DetailsRenderer.renderProgram(els.program, langData.program);
            }
        }
        if (els.gallery) {
            if (els.gallery.children.length === 0) {
                const list = window.ImagePaths && typeof window.ImagePaths.getGalleryArray === 'function'
                    ? window.ImagePaths.getGalleryArray(ctx.location, ctx.category, tripId, 0)
                    : [];
                DetailsRenderer.appendGalleryItem(posterSrc, els.gallery, els.bg);
                if (Array.isArray(list) && list.length > 0) {
                    list.forEach(src => DetailsRenderer.appendGalleryItem(src, els.gallery, els.bg));
                }
            }
        }
        const dictBtn = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const bookNow = dictBtn && dictBtn.global && typeof dictBtn.global.book_now === 'string' ? dictBtn.global.book_now : '';
        if (els.btnBook) els.btnBook.textContent = bookNow;
    },
    updatePriceOnly: (apiData) => {
        const priceEl = document.getElementById('detail-price');
        const cardPriceEl = document.getElementById('card-price');
        const breakdownEl = document.getElementById('card-price-breakdown');
        const pAdult = parseFloat(apiData.p_adult || '0');
        const dAdult = parseFloat(apiData.d_adult || '0');
        const pChild = parseFloat(apiData.p_child || '0');
        const dChild = parseFloat(apiData.d_child || '0');
        const minPax = parseInt(apiData.min_pax || '1', 10);
        const adultHero = dAdult > 0
            ? `<span class="inline-flex items-center gap-2"><span>👤</span><span class="line-through text-gray-400">€${pAdult}</span><span class="text-gold font-bold">€${dAdult}</span></span>`
            : `<span class="inline-flex items-center gap-2"><span>👤</span><span class="text-gold font-bold">€${pAdult}</span></span>`;
        if (priceEl) priceEl.innerHTML = adultHero;
        const headlinePrice = dAdult > 0 ? dAdult : pAdult;
        if (cardPriceEl) cardPriceEl.textContent = `€${headlinePrice}`;
        if (breakdownEl) {
            const adultRow = dAdult > 0
                ? `<div class="flex items-center gap-2"><span>👤</span><span class="line-through text-gray-400">€${pAdult}</span><span class="text-white font-bold">€${dAdult}</span></div>`
                : `<div class="flex items-center gap-2"><span>👤</span><span class="text-white font-bold">€${pAdult}</span></div>`;
            const childRow = (dChild > 0 || pChild > 0)
                ? (dChild > 0
                    ? `<div class="flex items-center gap-2"><span>👶</span><span class="line-through text-gray-400">€${pChild}</span><span class="text-white font-bold">€${dChild}</span></div>`
                    : `<div class="flex items-center gap-2"><span>👶</span><span class="text-white font-bold">€${pChild}</span></div>`)
                : '';
            const minPaxRow = `<div class="flex items-center gap-2"><span>👥</span><span class="text-gray-300">Min Pax: ${minPax}</span></div>`;
            breakdownEl.innerHTML = `${adultRow}${childRow ? childRow : ''}${minPaxRow}`;
        }
    },

    renderGalleryImmediate: (tripId) => {
        const els = { gallery: document.getElementById('gallery-grid'), bg: document.getElementById('hero-bg') };
        if (!els.gallery) return;
        const ctx = window.ImagePaths ? window.ImagePaths.resolveTripContext({ trip_id: tripId }) : { location: '', category: '', tripId };
        const posterSrc = window.ImagePaths ? window.ImagePaths.getPoster(ctx.location, ctx.category, tripId) : `assets/images/trips/${tripId}/poster.webp`;
        els.gallery.innerHTML = '';
        DetailsRenderer.appendGalleryItem(posterSrc, els.gallery, els.bg);
        const list = window.ImagePaths && typeof window.ImagePaths.getGalleryArray === 'function'
            ? window.ImagePaths.getGalleryArray(ctx.location, ctx.category, tripId, 0)
            : [];
        if (Array.isArray(list) && list.length > 0) {
            list.forEach(src => DetailsRenderer.appendGalleryItem(src, els.gallery, els.bg));
        }
    },

    appendGalleryItem: (src, container, bgEl) => {
        const exists = Array.from(container.querySelectorAll('img')).some(img => img.getAttribute('src') === src);
        if (exists) return;
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
                <span class="${isCompact ? (container.id === 'detail-highlights' ? 'text-white text-sm' : 'text-gray-600 text-sm') : (container.id === 'detail-highlights' ? 'text-white font-medium' : 'text-gray-800 font-medium')}">${item}</span>
            </li>
            `;
        }).join('');
    },

    renderProgram: (container, steps) => {
        if (!steps || !Array.isArray(steps) || !container) return;
        const html = steps.map((step, i) => {
            const isObj = step && typeof step === 'object';
            const time = isObj ? (step.time || '') : '';
            const activity = isObj ? (step.activity || '') : '';
            const details = isObj ? (step.details || '') : String(step || '');
            return `
                <div class="flex gap-4 mb-6 last:mb-0 relative">
                    <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center font-bold text-sm shadow-lg z-10">
                            ${i + 1}
                        </div>
                        ${i !== steps.length - 1 ? '<div class="w-0.5 h-full bg-gray-100 absolute top-8"></div>' : ''}
                    </div>
                    <div class="pb-2">
                        ${time ? `<div class="text-sm text-gray-500 mb-1">${time}</div>` : ''}
                        ${activity ? `<div class="text-white font-semibold mb-1">${activity}</div>` : ''}
                        <p class="text-gray-300 leading-relaxed">${details}</p>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = html;
    }
};

window.DetailsRenderer = DetailsRenderer;
window.addEventListener('langChanged', () => {
    if (window.DetailsRenderer && typeof window.DetailsRenderer.init === 'function') {
        window.DetailsRenderer.init();
    }
});
