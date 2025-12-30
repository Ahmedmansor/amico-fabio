/**
 * Presentation Layer (View Logic) - LUXURY EDITION
 * Handles rendering of Trip Cards using the White Theme & Gold Accents.
 */

const TripsRenderer = {
    /**
     * Renders the grid of trip cards.
     * @param {Array} trips - The array of trip objects.
     */
    render: (trips) => {
        const container = document.getElementById('trips-grid');
        if (!container) return;

        container.className = "trips-grid-container grid grid-cols-1 md:grid-cols-2 gap-4 pb-16 px-3 md:px-4 max-w-full mx-auto";

        // 0. Skeleton Loading State (Immediate & Modern)
        if (!window.hasShownSkeleton) {
            window.hasShownSkeleton = true;

            const skeletonHTML = Array(4).fill(0).map(() => `
                <div class="bg-[#1a1510] rounded-2xl shadow-xl overflow-hidden h-full flex flex-col border border-white/5 relative">
                    <!-- Image Skeleton -->
                    <div class="h-[280px] w-full bg-gray-800/50 relative overflow-hidden">
                         <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                    </div>
                    
                    <!-- Content Skeleton -->
                    <div class="p-6 flex-grow space-y-6">
                        <!-- Title -->
                        <div class="h-8 bg-gray-800/50 rounded-lg w-3/4 relative overflow-hidden">
                             <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                        </div>
                        
                        <!-- Description Lines -->
                        <div class="space-y-3">
                            <div class="h-3 bg-gray-800/30 rounded w-full"></div>
                            <div class="h-3 bg-gray-800/30 rounded w-5/6"></div>
                            <div class="h-3 bg-gray-800/30 rounded w-4/6"></div>
                        </div>

                        <!-- Price & Button -->
                        <div class="pt-4 border-t border-white/5 flex flex-col gap-4">
                             <div class="h-4 bg-gray-800/50 rounded w-1/3"></div>
                             <div class="h-12 bg-gray-800/50 rounded-xl w-full relative overflow-hidden">
                                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite] -translate-x-full"></div>
                             </div>
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = skeletonHTML;

            // Enforce minimum viewing time for the premium feel
            setTimeout(() => {
                TripsRenderer.renderRealCards(trips, container);
            }, 1500); // Reduced to 1.5s for snappier feel while keeping the effect
            return;
        }

        TripsRenderer.renderRealCards(trips, container);
    },

    renderRealCards: (trips, container) => {
        container.innerHTML = "";

        // Fallback to DUMMY_DATA if empty
        if ((!trips || trips.length === 0) && window.api && window.api.DUMMY_DATA && window.api.DUMMY_DATA.Trips_Prices) {
            trips = window.api.DUMMY_DATA.Trips_Prices;
        }

        // Filter: Strictly show featured === 'TRUE'
        const filteredTrips = trips.filter(t => {
            return String(t.featured || '').toUpperCase() === 'TRUE';
        });

        if (!filteredTrips || filteredTrips.length === 0) {
            const activeLang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';
            const dict = activeLang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
            const emptyText = dict && dict.global && typeof dict.global.no_exclusive_experiences === 'string'
                ? dict.global.no_exclusive_experiences
                : '';
            container.innerHTML = `<div class="col-span-full text-center py-20">
                <p class="text-gray-400 text-xl font-playfair italic" data-i18n="global.no_exclusive_experiences">${emptyText}</p>
            </div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        // Why: Use unified language state from localStorage ('fabio_lang') or documentElement.lang to avoid inconsistencies.
        const lang = localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it';

        filteredTrips.forEach((trip, index) => {
            const card = TripsRenderer.createTripCard(trip, lang, index);
            if (card) {
                fragment.appendChild(card);
            }
        });

        container.appendChild(fragment);

        if (window.AOS) {
            window.AOS.refresh();
        }
    },

    /**
     * Creates a single Trip Card DOM element.
     */
    createTripCard: (trip, lang, index) => {
        // Why: Resolve the dataset once per card based on the unified language.
        const i18n = lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {});
        const staticData = i18n.trips && i18n.trips[trip.trip_id] ? i18n.trips[trip.trip_id] : null;

        let title = staticData ? staticData.title : (trip.trip_id || "").replace(/_/g, " ");

        const p_adult = parseFloat(trip.p_adult) || 0;
        const d_adult = parseFloat(trip.d_adult) || 0;
        let priceRowHTML = '';
        let dealBannerHTML = '';

        if (d_adult > 0) {
            const perc = p_adult > 0 ? Math.round(((p_adult - d_adult) / p_adult) * 100) : 0;
            const ltdText = i18n.global && i18n.global.limited_time_deal
                ? i18n.global.limited_time_deal
                : '';
            dealBannerHTML = `
                <div class="deal-banner">
                    <span class="deal-percent">-${perc}%</span>
                </div>
            `;
            priceRowHTML = `
                <div class="price-row">
                    <span class="price-old">€${p_adult}</span>
                    <span class="price-new">€${d_adult}</span>
                    <span class="deal-inline">${ltdText}</span>
                </div>
            `;
        } else {
            priceRowHTML = `
                <div class="price-row">
                    <span class="price-new">€${p_adult}</span>
                </div>
            `;
        }

        const imgPath = `assets/images/trips/${trip.trip_id}/poster.jpg`;
        const fallbackPath = 'assets/logo-fabio-square.jpg';

        const description = staticData ? staticData.short_desc : '';

        const delay = index * 100;

        const lblStart = i18n.global && i18n.global.price_from ? i18n.global.price_from : '';
        const lblBtn = i18n.global && i18n.global.discover ? i18n.global.discover : '';

        const standardBadge = lang === 'it' ? trip.badge_it : trip.badge_en;

        const cardHTML = `
            <article class="catalog-card trip-card" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="catalog-card-image">
                    <img src="${imgPath}" alt="${title}" class="catalog-card-img"
                         loading="lazy" onerror="this.onerror=null; this.src='${fallbackPath}';">
                    <div class="card-badges">
                        ${d_adult > 0 ? dealBannerHTML : ''}
                        ${standardBadge ? `<span class="standard-badge">${standardBadge}</span>` : ''}
                    </div>
                </div>
                <div class="card-content">
                    <h3 class="catalog-card-title">${title}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc">${description}</p>
                    <div class="card-footer">
                        <div class="price-block">
                            <span class="label-start" data-i18n="global.price_from">${lblStart}</span>
                            ${priceRowHTML}
                        </div>
                        <button class="card-btn" onclick="window.location.href = 'details.html?id=${trip.trip_id}'" data-i18n="global.discover">${lblBtn}</button>
                    </div>
                </div>
            </article>
        `;

        const wrapper = document.createElement('div');
        wrapper.className = "h-full w-full";
        wrapper.innerHTML = cardHTML.trim();
        return wrapper.firstElementChild;
    }
};

window.TripsRenderer = TripsRenderer;
