/**
 * Presentation Layer (View Logic) - LUXURY EDITION
 * Handles rendering of Trip Cards using the White Theme & Gold Accents.
 */

const TripsRenderer = {
    state: {
        hasShownSkeleton: false
    },

    _utils: {
        getLang: () => localStorage.getItem('fabio_lang') || document.documentElement.lang || 'it',
        getI18n: (lang) => lang === 'en' ? (window.i18nEn || {}) : (window.i18nIt || {}),
        resolveCategory: (trip) => {
            if (window.ExploreRenderer && typeof window.ExploreRenderer.resolveCategory === 'function') {
                return window.ExploreRenderer.resolveCategory(trip);
            }
            return String(trip.category || '').toLowerCase().trim();
        },
        isPackage: (trip) => {
            const cat = TripsRenderer._utils.resolveCategory(trip);
            return String(trip.type || '').toLowerCase() === 'package' || cat === 'bundles';
        }
    },

    /**
     * Renders the grid of trip cards.
     * @param {Array} trips - The array of trip objects.
     */
    render: (trips) => {
        const container = document.getElementById('trips-grid');
        if (!container) return;

        container.className = "trips-grid-container grid grid-cols-1 md:grid-cols-2 gap-4 pb-16 px-3 md:px-4 max-w-full mx-auto";

        // Skeleton Loading State (Immediate & Modern)
        if (!TripsRenderer.state.hasShownSkeleton && !window.hasShownSkeleton) {
            TripsRenderer.state.hasShownSkeleton = true;
            window.hasShownSkeleton = true;

            TripsRenderer._renderSkeleton(container);

            // Enforce minimum viewing time for the premium feel
            setTimeout(() => {
                TripsRenderer.renderRealCards(trips, container);
            }, 1500); // Reduced to 1.5s for snappier feel while keeping the effect
            return;
        }

        TripsRenderer.renderRealCards(trips, container);
    },

    _renderSkeleton: (container) => {
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
    },

    renderRealCards: (trips, container) => {
        container.innerHTML = "";

        // Filter: Strictly show featured === 'TRUE'
        const filteredTrips = trips.filter(t => {
            return String(t.featured || '').toUpperCase() === 'TRUE';
        });

        if (!filteredTrips || filteredTrips.length === 0) {
            TripsRenderer._renderEmptyState(container);
            return;
        }

        const fragment = document.createDocumentFragment();
        // Why: Use unified language state from localStorage ('fabio_lang') or documentElement.lang to avoid inconsistencies.
        const lang = TripsRenderer._utils.getLang();

        filteredTrips.forEach((trip, index) => {
            const card = TripsRenderer.createTripCard(trip, lang, index);
            if (card) {
                fragment.appendChild(card);
            }
        });

        container.appendChild(fragment);

        
    },

    _renderEmptyState: (container) => {
        const lang = TripsRenderer._utils.getLang();
        const dict = TripsRenderer._utils.getI18n(lang);
        const emptyText = dict && dict.global && typeof dict.global.no_exclusive_experiences === 'string'
            ? dict.global.no_exclusive_experiences
            : '';
        container.innerHTML = `<div class="col-span-full text-center py-20">
            <p class="text-gray-400 text-xl font-playfair italic" data-i18n="global.no_exclusive_experiences">${emptyText}</p>
        </div>`;
    },

    createTripCard: (trip, lang, index) => {
        const i18n = TripsRenderer._utils.getI18n(lang);
        const isPackage = TripsRenderer._utils.isPackage(trip);

        // Data Resolution
        const { title, description } = TripsRenderer._resolveTextData(trip, i18n);
        const { priceRowHTML, dealBannerHTML } = TripsRenderer._resolvePriceData(trip, i18n, isPackage);
        const imgPath = TripsRenderer._resolveImage(trip, isPackage);
        const standardBadge = TripsRenderer._resolveBadge(trip, lang, i18n);

        // UI Constants
        const __parts = (typeof window !== 'undefined' && window.location && window.location.pathname ? window.location.pathname.split('/') : []);
        const __repo = __parts.filter(Boolean)[0] || '';
        const __fallbackBase = __repo ? `/${__repo}/` : '/';
        const __BASE = (typeof window !== 'undefined' && window.FABIO_BASE_URL) || __fallbackBase;
        const ph = window.ImagePaths ? window.ImagePaths.ui.placeholder : `${__BASE}assets/images/ui/placeholder.webp`;
        const fb = window.ImagePaths ? window.ImagePaths.ui.fallbackLogo : `${__BASE}assets/images/logo/logo-fabio-square.webp`;
        const delay = index * 100;

        // Labels
        const lblStart = i18n.global && i18n.global.price_from ? i18n.global.price_from : '';
        const lblBtnDefault = i18n.global && i18n.global.discover ? i18n.global.discover : '';
        const lblBtnPackage = i18n.global && i18n.global.discover_package ? i18n.global.discover_package : lblBtnDefault;
        const btnLabel = isPackage ? lblBtnPackage : lblBtnDefault;
        const btnKey = isPackage ? 'global.discover_package' : 'global.discover';
        const lblPremium = i18n.global && i18n.global.premium_package ? i18n.global.premium_package : 'Premium Package';

        // Links and Classes
        const targetIdRaw = trip.package_id || trip.trip_id || '';
        const encodedId = encodeURIComponent(targetIdRaw);
        const href = isPackage
            ? `package-details.html?id=${encodedId}`
            : `details.html?id=${encodedId}`;

        const cardClasses = ['catalog-card', 'trip-card'];
        if (isPackage) cardClasses.push('premium-package-card');
        const badgeExtraClass = isPackage ? ' standard-badge-premium' : '';

        const cardHTML = `
            <article class="${cardClasses.join(' ')}" data-trip-id="${trip.trip_id}">
                <div class="catalog-card-image">
                    <img src="${imgPath}" alt="${title}" class="catalog-card-img"
                         loading="lazy" onerror="this.onerror=function(){this.onerror=null; this.src='${fb}';}; this.src='${ph}';">
                    <div class="card-badges">
                        ${dealBannerHTML}
                        ${standardBadge ? `<span class="standard-badge${badgeExtraClass}">${standardBadge}</span>` : ''}
                    </div>
                </div>
                <div class="card-content">
                    ${isPackage ? `<div class="text-[10px] tracking-[0.22em] uppercase text-gold mb-1" data-i18n="global.premium_package">${lblPremium}</div>` : ``}
                    <h3 class="catalog-card-title">${title}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc">${description}</p>
                    <div class="card-footer">
                        <div class="price-block">
                            <span class="label-start" data-i18n="global.price_from">${lblStart}</span>
                            ${priceRowHTML}
                        </div>
                        <button class="card-btn" onclick="sessionStorage.setItem('fabio_nav_source','details'); window.location.href = '${href}'" data-i18n="${btnKey}">${btnLabel}</button>
                    </div>
                </div>
            </article>
        `;

        const wrapper = document.createElement('div');
        wrapper.className = "h-full w-full";
        wrapper.innerHTML = cardHTML.trim();
        return wrapper.firstElementChild;
    },

    _resolveTextData: (trip, i18n) => {
        const tripKey = trip.trip_id || trip.package_id || '';
        const staticData = i18n.trips && i18n.trips[tripKey] ? i18n.trips[tripKey] : null;
        return {
            title: staticData ? staticData.title : (trip.trip_id || "").replace(/_/g, " "),
            description: staticData ? staticData.short_desc : ''
        };
    },

    _resolvePriceData: (trip, i18n, isPackage) => {
        const p_adult = parseFloat(trip.p_adult) || 0;
        const d_adult = parseFloat(trip.d_adult) || 0;
        let priceRowHTML = '';
        let dealBannerHTML = '';

        if (d_adult > 0) {
            const perc = p_adult > 0 ? Math.round(((p_adult - d_adult) / p_adult) * 100) : 0;
            const ltdText = i18n.global && i18n.global.limited_time_deal
                ? i18n.global.limited_time_deal
                : '';

            if (isPackage) {
                dealBannerHTML = `
                    <div class="discount-ribbon">
                        <span>-${perc}%</span>
                    </div>
                `;
            } else {
                dealBannerHTML = `
                    <div class="deal-banner">
                        <span class="deal-percent">-${perc}%</span>
                    </div>
                `;
            }

            priceRowHTML = `
                <div class="price-row">
                    <span class="price-old">€${p_adult}</span>
                    <span class="price-new">€${d_adult}</span>
                    <span class="deal-inline">${ltdText}</span>
                </div>
            `;
        } else if (p_adult > 0) {
            priceRowHTML = `
                <div class="price-row">
                    <span class="price-new">€${p_adult}</span>
                </div>
            `;
        } else {
            priceRowHTML = `<div class="price-skeleton"></div>`;
        }

        return { priceRowHTML, dealBannerHTML };
    },

    _resolveImage: (trip, isPackage) => {
        const ctx = window.ImagePaths ? window.ImagePaths.resolveTripContext(trip) : { location: '', category: '', tripId: (trip.trip_id || '') };
        let imgPath = window.ImagePaths ? window.ImagePaths.getPoster(ctx.location, ctx.category, ctx.tripId) : `${__BASE}assets/images/trips/${trip.trip_id}/poster.webp`;

        if (isPackage) {
            const locRaw = trip.location || trip.Location || trip.loc || trip.Loc || 'sharm';
            const loc = String(locRaw).toLowerCase().trim();
            const pkgId = trip.package_id || trip.trip_id;
            imgPath = `${__BASE}assets/images/packages/${loc}/${pkgId}/poster.webp`;
        }
        return imgPath;
    },

    _resolveBadge: (trip, lang, i18n) => {
        const globalDict = i18n.global || {};
        const badgesDict = globalDict.badges || {};
        if (trip.badge_key) {
            const rawKey = String(trip.badge_key).trim();
            return badgesDict[rawKey] || badgesDict[rawKey.toLowerCase()] || '';
        }
        return lang === 'it' ? (trip.badge_it || '') : (trip.badge_en || '');
    }
};

window.TripsRenderer = TripsRenderer;

const LocationRenderer = {
    render: () => {
        const container = document.getElementById('trips-grid');
        if (!container) return;
        const items = [
            {
                id: 'sharm',
                title: 'Sharm El Sheikh',
                img: `${__BASE}assets/images/locations/sharm.jpg`
            },
            {
                id: 'cairo',
                title: 'Cairo',
                img: `${__BASE}assets/images/locations/cairo.jpg`
            },
            {
                id: 'luxor_and_aswan',
                title: 'Luxor & Aswan',
                img: `${__BASE}assets/images/locations/luxor_aswan.jpg`
            },
            {
                id: 'desert',
                title: 'Sinai Desert',
                img: `${__BASE}assets/images/locations/desert.jpg`
            }
        ];
        container.className = "grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl px-4 mx-auto";
        const frag = document.createDocumentFragment();
        items.forEach((loc, i) => {
            const delay = i * 120;
            const el = document.createElement('article');
            el.className = "catalog-card trip-card";
            el.innerHTML = `
                <div class="catalog-card-image">
                    <img src="${loc.img}" alt="${loc.title}" class="catalog-card-img" loading="lazy"
                         onerror="this.onerror=null; this.src='${window.ImagePaths ? window.ImagePaths.ui.fallbackLogo : `${__BASE}assets/images/logo/logo-fabio-square.webp`}';">
                    <div class="card-badges"></div>
                </div>
                <div class="card-content">
                    <h3 class="catalog-card-title">${loc.title}</h3>
                    <div class="card-divider"></div>
                    <p class="catalog-card-desc"></p>
                    <div class="card-footer">
                        <div class="price-block"></div>
                        <a class="card-btn" href="explore.html?loc=${loc.id}" data-i18n="global.discover">Explore</a>
                    </div>
                </div>
            `;
            frag.appendChild(el);
        });
        container.innerHTML = '';
        container.appendChild(frag);
    }
};

window.LocationRenderer = LocationRenderer;
